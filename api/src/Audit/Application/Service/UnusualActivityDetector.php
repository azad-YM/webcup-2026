<?php

declare(strict_types=1);

namespace Audit\Application\Service;

use Audit\Application\Ports\Provider\AccountSignalsProvider;
use Audit\Application\Ports\Provider\CitizenSignalsProvider;
use Audit\Application\Ports\Repository\AuditEntryRepository;
use Audit\Domain\Entity\Anomaly;
use Shared\Application\Ports\Service\AbuseSignals;

/**
 * F85 (ADR 012) : règles du détecteur d'activité inhabituelle et d'informations incohérentes.
 *
 * Chaque source est lue **par un port** : IAM (connexions), Citizen (données des habitants), Shared (signaux
 * d'abus : `429`, formulaires refusés), et le journal des actions qu'Audit possède. Aucune requête sur les tables
 * d'un autre BC. Les règles sont volontairement simples, explicables en une phrase et réglées par des seuils
 * (constantes ci-dessous) ; l'IA ne décide de rien : elle rédige seulement le résumé du jour.
 */
final readonly class UnusualActivityDetector
{
    /** Libellés des règles, affichés dans l'admin. */
    public const RULES = [
        'login.peak' => 'Pic de connexions refusées',
        'login.account_attack' => 'Compte visé par des tentatives de connexion',
        'login.ip_stuffing' => 'Adresse qui essaie de nombreux comptes',
        'devices.many_new' => 'Connexions depuis beaucoup d’appareils nouveaux',
        'account.inactive_signed_in' => 'Compte suspendu encore utilisé',
        'account.suspended_still_active' => 'Habitant suspendu dont le compte reste actif',
        'submissions.rate_limited' => 'Rafale d’envois bloquée',
        'submissions.bot' => 'Envois automatiques probables (robot)',
        'submissions.citizen_burst' => 'Rafale d’envois d’un habitant',
        'agent.mass_changes' => 'Masse de changements par un agent',
        'agent.sensitive_views' => 'Affichages répétés de données sensibles',
    ];

    public const PEAK_WARNING = 5;
    public const PEAK_CRITICAL = 20;
    public const NEW_DEVICES_WARNING = 3;
    public const NEW_DEVICES_CRITICAL = 5;
    public const RATE_LIMITED_BURST = 3;
    public const BOT_BURST = 5;
    public const CITIZEN_BURST = 8;
    public const AGENT_CHANGES_WARNING = 30;
    public const AGENT_CHANGES_CRITICAL = 80;
    public const SENSITIVE_VIEWS_WARNING = 10;
    public const SENSITIVE_VIEWS_CRITICAL = 25;
    public const ACCOUNT_LOCK_SECONDS = 900;

    public function __construct(
        private AccountSignalsProvider $accounts,
        private CitizenSignalsProvider $citizens,
        private AuditEntryRepository $journal,
        private AbuseSignals $abuse,
    ) {}

    /** @return list<DetectedAnomaly> */
    public function detect(\DateTimeImmutable $now): array
    {
        $hour = $now->modify('-1 hour');
        $day = $now->modify('-24 hours');
        $hourKey = $now->format('YmdH');
        $dayKey = $now->format('Ymd');

        return [
            ...$this->logins($hour, $hourKey, $dayKey),
            ...$this->devices($day, $dayKey),
            ...$this->inactiveAccounts($day),
            ...$this->submissions($hour, $hourKey, $dayKey),
            ...$this->agents($hour, $hourKey),
            ...$this->integrity($now),
        ];
    }

    /** @return list<DetectedAnomaly> */
    private function logins(\DateTimeImmutable $since, string $hourKey, string $dayKey): array
    {
        $found = [];
        $signals = $this->accounts->blockedLoginsSince($since);
        $total = array_sum(array_map(static fn ($s): int => $s->lockouts, $signals));
        if ($total >= self::PEAK_WARNING) {
            $found[] = new DetectedAnomaly(
                'login.peak|'.$hourKey,
                'login.peak',
                'security',
                $total >= self::PEAK_CRITICAL ? Anomaly::CRITICAL : Anomaly::WARNING,
                self::RULES['login.peak'],
                sprintf('%d verrouillages de connexion en une heure (seuil d’alerte : %d). Plusieurs mots de passe erronés à la suite déclenchent ces verrouillages : il peut s’agir d’une tentative d’intrusion à grande échelle.', $total, self::PEAK_WARNING),
                array_slice(array_map(static fn ($s): array => ['type' => $s->scope === 'ip' ? 'adresse' : 'compte', 'id' => $s->targetKey, 'label' => $s->label], $signals), 0, 10),
            );
        }
        foreach ($signals as $signal) {
            if ($signal->scope === 'ip') {
                $found[] = new DetectedAnomaly(
                    'login.ip|'.$signal->targetKey.'|'.$dayKey,
                    'login.ip_stuffing',
                    'security',
                    $signal->lockouts >= 3 ? Anomaly::CRITICAL : Anomaly::WARNING,
                    self::RULES['login.ip_stuffing'],
                    sprintf('L’adresse %s a été bloquée %d fois après %d échecs sur des comptes différents : essai automatique de mots de passe probable. Le blocage est déjà actif ; surveillez les comptes visés.', $signal->label, $signal->lockouts, $signal->failures),
                    [['type' => 'adresse', 'id' => $signal->targetKey, 'label' => $signal->label]],
                );
                continue;
            }
            $critical = $signal->lockouts >= 2 && $signal->accountId !== null;
            $found[] = new DetectedAnomaly(
                'login.account|'.$signal->targetKey.'|'.$dayKey,
                'login.account_attack',
                'security',
                $critical ? Anomaly::CRITICAL : Anomaly::WARNING,
                self::RULES['login.account_attack'],
                $signal->accountId === null
                    ? sprintf('Tentatives répétées sur %s, qui ne correspond à aucun compte (%d verrouillage(s)). Aucune action nécessaire hors surveillance.', $signal->label, $signal->lockouts)
                    : sprintf('Le compte %s a été verrouillé %d fois en une heure après %d échecs.%s', $signal->label, $signal->lockouts, $signal->failures, $critical ? ' Protection renforcée appliquée automatiquement.' : ''),
                [['type' => 'compte', 'id' => $signal->accountId ?? $signal->targetKey, 'label' => $signal->label]],
                $critical ? $signal->accountId : null,
                self::ACCOUNT_LOCK_SECONDS,
            );
        }

        return $found;
    }

    /** @return list<DetectedAnomaly> */
    private function devices(\DateTimeImmutable $since, string $dayKey): array
    {
        $found = [];
        foreach ($this->accounts->newDevicesSince($since, self::NEW_DEVICES_WARNING) as $account) {
            $critical = $account->count >= self::NEW_DEVICES_CRITICAL;
            $found[] = new DetectedAnomaly(
                'devices|'.$account->accountId.'|'.$dayKey,
                'devices.many_new',
                'security',
                $critical ? Anomaly::CRITICAL : Anomaly::WARNING,
                self::RULES['devices.many_new'],
                sprintf('Le compte %s s’est connecté depuis %d appareils nouveaux en 24 heures. Un partage du mot de passe ou un vol d’identifiants est possible.%s', $account->label, $account->count, $critical ? ' Le code par e-mail est désormais exigé et le titulaire a été prévenu.' : ''),
                [['type' => 'compte', 'id' => $account->accountId, 'label' => $account->label]],
                $critical ? $account->accountId : null,
                0,
            );
        }

        return $found;
    }

    /** @return list<DetectedAnomaly> */
    private function inactiveAccounts(\DateTimeImmutable $since): array
    {
        $found = [];
        foreach ($this->accounts->inactiveAccountsSignedInSince($since) as $account) {
            $found[] = new DetectedAnomaly(
                'inactive|'.$account->accountId,
                'account.inactive_signed_in',
                'integrity',
                Anomaly::CRITICAL,
                self::RULES['account.inactive_signed_in'],
                sprintf('Le compte %s est suspendu mais compte %d connexion(s) réussie(s) ces dernières 24 heures. Une session ouverte avant la suspension ou une incohérence de données est possible : vérifiez le compte.', $account->label, $account->count),
                [['type' => 'compte', 'id' => $account->accountId, 'label' => $account->label]],
            );
        }
        $suspended = $this->citizens->suspendedAccountIds();
        if ($suspended !== []) {
            foreach ($this->accounts->activeAmong($suspended) as $account) {
                $found[] = new DetectedAnomaly(
                    'suspended-active|'.$account->accountId,
                    'account.suspended_still_active',
                    'integrity',
                    Anomaly::WARNING,
                    self::RULES['account.suspended_still_active'],
                    sprintf('L’habitant lié au compte %s est suspendu, mais son compte de connexion est toujours actif : il peut encore se connecter. Refaites la suspension depuis « Comptes citoyens ».', $account->label),
                    [['type' => 'compte', 'id' => $account->accountId, 'label' => $account->label]],
                );
            }
        }

        return $found;
    }

    /** @return list<DetectedAnomaly> */
    private function submissions(\DateTimeImmutable $since, string $hourKey, string $dayKey): array
    {
        $found = [];
        foreach ($this->abuse->burstsSince($since, self::RATE_LIMITED_BURST) as $burst) {
            if ($burst['kind'] === AbuseSignals::RATE_LIMITED) {
                $found[] = new DetectedAnomaly(
                    'rate|'.$burst['rule'].'|'.$burst['client'].'|'.$hourKey,
                    'submissions.rate_limited',
                    'abuse',
                    $burst['count'] >= 10 ? Anomaly::CRITICAL : Anomaly::WARNING,
                    self::RULES['submissions.rate_limited'],
                    sprintf('Un même appareil (empreinte %s) a été freiné %d fois en une heure sur « %s ». Les envois en trop ont été refusés automatiquement.', $burst['client'], $burst['count'], $burst['rule']),
                    [['type' => 'appareil', 'id' => $burst['client'], 'label' => 'Empreinte '.$burst['client']]],
                );
            } elseif ($burst['count'] >= self::BOT_BURST) {
                $found[] = new DetectedAnomaly(
                    'bot|'.$burst['rule'].'|'.$burst['client'].'|'.$dayKey,
                    'submissions.bot',
                    'abuse',
                    $burst['kind'] === AbuseSignals::FORM_REJECTED || $burst['count'] >= 20 ? Anomaly::CRITICAL : Anomaly::WARNING,
                    self::RULES['submissions.bot'],
                    sprintf('%d envois du formulaire « %s » %s en une heure depuis un même appareil (empreinte %s). Ces envois n’ont pas été enregistrés.', $burst['count'], $burst['rule'], $burst['kind'] === AbuseSignals::FORM_REJECTED ? 'refusés (champ piège rempli)' : 'soumis à une question de vérification', $burst['client']),
                    [['type' => 'appareil', 'id' => $burst['client'], 'label' => 'Empreinte '.$burst['client']]],
                );
            }
        }
        foreach ($this->citizens->submissionBursts($since, self::CITIZEN_BURST) as $issue) {
            $found[] = new DetectedAnomaly($issue->key.'|'.$dayKey, $issue->rule, $issue->category, $issue->severity, $issue->title, $issue->explanation, $issue->related);
        }

        return $found;
    }

    /** @return list<DetectedAnomaly> */
    private function agents(\DateTimeImmutable $since, string $hourKey): array
    {
        $found = [];
        foreach ($this->journal->actorBursts($since, ['iam.login.', 'citizen.sensitive-data.', 'audit.'], self::AGENT_CHANGES_WARNING) as $actor) {
            $found[] = new DetectedAnomaly(
                'agent.changes|'.$actor['actorId'].'|'.$hourKey,
                'agent.mass_changes',
                'security',
                $actor['count'] >= self::AGENT_CHANGES_CRITICAL ? Anomaly::CRITICAL : Anomaly::WARNING,
                self::RULES['agent.mass_changes'],
                sprintf('%s a effectué %d modifications (%d types d’action) en une heure, bien au-delà de l’usage habituel (seuil : %d). Vérifiez dans le journal des actions qu’il s’agit d’un travail prévu.', $actor['actorLabel'], $actor['count'], $actor['actions'], self::AGENT_CHANGES_WARNING),
                [['type' => 'agent', 'id' => (string) $actor['actorId'], 'label' => $actor['actorLabel']]],
            );
        }
        foreach ($this->journal->actionBursts('citizen.sensitive-data.viewed', $since, self::SENSITIVE_VIEWS_WARNING, 'records') as $actor) {
            $found[] = new DetectedAnomaly(
                'agent.sensitive|'.$actor['actorId'].'|'.$hourKey,
                'agent.sensitive_views',
                'security',
                $actor['count'] >= self::SENSITIVE_VIEWS_CRITICAL ? Anomaly::CRITICAL : Anomaly::WARNING,
                self::RULES['agent.sensitive_views'],
                sprintf('%s a affiché %d fois des données personnelles sensibles en une heure (%d fiches au total). Un affichage répété peut signaler une extraction de données.', $actor['actorLabel'], $actor['count'], $actor['total']),
                [['type' => 'agent', 'id' => (string) $actor['actorId'], 'label' => $actor['actorLabel']]],
            );
        }

        return $found;
    }

    /** @return list<DetectedAnomaly> */
    private function integrity(\DateTimeImmutable $now): array
    {
        return array_map(
            static fn ($issue): DetectedAnomaly => new DetectedAnomaly($issue->key, $issue->rule, $issue->category, $issue->severity, $issue->title, $issue->explanation, $issue->related),
            $this->citizens->integrityIssues($now),
        );
    }
}
