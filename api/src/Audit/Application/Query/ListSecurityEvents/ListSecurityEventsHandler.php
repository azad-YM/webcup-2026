<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListSecurityEvents;

use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Application\Ports\Repository\AuditEntryRepository;
use Audit\Domain\Entity\Anomaly;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F100 : les derniers événements de sécurité, pour le suivi quotidien des agents.
 *
 * Un seul fil, du plus récent au plus ancien, qui réunit les actions sensibles du journal (connexions bloquées,
 * comptes protégés ou suspendus, données sensibles consultées, services désactivés, nouveaux membres et rôles) et les
 * anomalies détectées. Chaque événement est rédigé en clair : ce qui s'est passé, sa gravité et ce qu'il faut faire.
 *
 * Public : tout membre actif de l'administration (agents et administrateurs). Sans `admin.security.read`, les détails
 * identifiants (e-mail, adresse IP, éléments liés d'une anomalie) sont masqués ; sans `admin.audit.read`, pas de lien
 * vers le journal ; les liens vers les écrans réservés sont retirés.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListSecurityEventsHandler
{
    /**
     * Actions suivies : préfixe → [gravité, titre clair, quoi faire]. Le premier préfixe qui correspond l'emporte.
     *
     * @var array<string, array{0: string, 1: string, 2: string}>
     */
    private const CATALOGUE = [
        'iam.login.blocked' => ['warning', 'Connexion bloquée après plusieurs échecs', 'Rien à faire si l’accès revient seul après le délai. Si un collègue ou un habitant signale un blocage répété, vérifiez qu’il s’agit bien de lui avant de l’aider.'],
        'audit.anomaly.protected' => ['critical', 'Compte protégé automatiquement', 'Le compte est suspendu par précaution : vérifiez l’activité dans « Activité inhabituelle » avant de le réactiver.'],
        'audit.anomaly.status_changed' => ['info', 'Anomalie examinée par un agent', 'Pour information.'],
        'citizen.account.suspended' => ['warning', 'Compte d’habitant suspendu', 'Assurez-vous que l’habitant a été prévenu et sait comment faire réactiver son compte.'],
        'citizen.account.reactivated' => ['info', 'Compte d’habitant réactivé', 'Pour information.'],
        'citizen.sensitive-data.' => ['info', 'Données sensibles consultées', 'Normal dans le cadre d’une demande. Signalez toute consultation qui ne correspond pas à votre travail.'],
        'citizen.personal-data.exported' => ['info', 'Un habitant a téléchargé ses données', 'Pour information : exercice normal du droit d’accès.'],
        'administration.service.disabled' => ['warning', 'Service désactivé en urgence', 'Les nouvelles demandes de ce service sont refusées : orientez les habitants vers l’alternative indiquée.'],
        'administration.member.added' => ['info', 'Nouveau membre de l’administration', 'Vérifiez que cette arrivée était prévue.'],
        'administration.role.created' => ['info', 'Nouveau rôle créé', 'Vérifiez que les permissions du rôle sont justifiées.'],
    ];
    private const SEVERITY_RANK = ['critical' => 0, 'warning' => 1, 'info' => 2];

    public function __construct(
        private AuditAccessPolicy $access,
        private AuditEntryRepository $entries,
        private AnomalyRepository $anomalies,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ListSecurityEventsQuery $query): array
    {
        if (!$this->access->canReadSecurityEvents()) {
            throw new AccessDeniedException('Les événements de sécurité sont réservés aux membres de l’administration.');
        }
        $full = $this->access->canReadSecurityEntries();
        $journal = $this->access->canReadAuditTrail();
        $limit = max(1, min(50, $query->limit));
        $now = $this->clock->now();
        $since = $now->modify(sprintf('-%d days', max(1, min(30, $query->days))));
        $events = [];
        foreach ($this->entries->latestOfActions(array_keys(self::CATALOGUE), $since, $limit) as $entry) {
            $events[] = $this->fromEntry($entry, $full, $journal);
        }
        foreach ($this->anomalies->search(null, null, $limit) as $anomaly) {
            if ($anomaly->lastSeenAt() >= $since) {
                $events[] = self::fromAnomaly($anomaly, $full);
            }
        }
        usort($events, static fn (array $a, array $b): int => strcmp($b['occurredAt'], $a['occurredAt']));
        $events = array_slice($events, 0, $limit);
        $dayAgo = $now->modify('-24 hours')->format(DATE_ATOM);
        $recent = array_filter($events, static fn (array $event): bool => $event['occurredAt'] >= $dayAgo);
        $toReview = array_filter($events, static fn (array $event): bool => $event['toReview']);

        return [
            'generatedAt' => $now->format(DATE_ATOM),
            'days' => max(1, min(30, $query->days)),
            'detailed' => $full,
            'summary' => [
                'last24h' => count($recent),
                'critical24h' => count(array_filter($recent, static fn (array $event): bool => $event['severity'] === 'critical')),
                'warning24h' => count(array_filter($recent, static fn (array $event): bool => $event['severity'] === 'warning')),
                'toReview' => count($toReview),
                'headline' => self::headline($recent, count($toReview)),
            ],
            'events' => $events,
        ];
    }

    /** @param array<string, mixed> $entry @return array<string, mixed> */
    private function fromEntry(array $entry, bool $full, bool $journal): array
    {
        $action = (string) $entry['action'];
        [$severity, $title, $todo] = self::describe($action);
        $login = str_starts_with($action, 'iam.login.');
        $summary = (string) $entry['summary'];
        $details = is_array($entry['details']) ? $entry['details'] : [];
        if ($login && !$full) {
            // Sans admin.security.read : ni e-mail ni adresse IP, seulement ce qui s'est passé.
            $summary = sprintf('Connexion bloquée après %d échecs successifs (compte et adresse masqués).', (int) ($details['failures'] ?? 0));
        }

        return [
            'id' => 'entry-'.$entry['id'],
            'source' => 'journal',
            'occurredAt' => $entry['occurredAt'],
            'action' => $action,
            'severity' => $severity,
            'title' => $title,
            'description' => $summary,
            'whatToDo' => $todo,
            'actor' => $login && !$full ? 'Personne non connectée' : (string) ($entry['actor']['label'] ?? 'Système'),
            'status' => null,
            'toReview' => $severity === 'critical',
            'link' => match (true) {
                $login => $full ? '/admin/security' : null,
                str_starts_with($action, 'audit.anomaly.') => $full ? '/admin/activite-inhabituelle' : null,
                default => $journal ? '/admin/journal' : null,
            },
        ];
    }

    /** @return array<string, mixed> */
    private static function fromAnomaly(Anomaly $anomaly, bool $full): array
    {
        $open = $anomaly->status() !== Anomaly::HANDLED;

        return [
            'id' => 'anomaly-'.$anomaly->id,
            'source' => 'detection',
            'occurredAt' => $anomaly->lastSeenAt()->format(DATE_ATOM),
            'action' => 'audit.anomaly.detected',
            'severity' => $anomaly->severity(),
            'title' => 'Activité inhabituelle : '.$anomaly->title(),
            'description' => $full ? $anomaly->explanation() : 'Détectée automatiquement. Les détails sont réservés aux responsables de la sécurité.',
            'whatToDo' => match (true) {
                !$open => 'Déjà traitée par un responsable.',
                $anomaly->severity() === Anomaly::CRITICAL => $full ? 'À examiner en priorité : ouvrez « Activité inhabituelle » et marquez-la comme traitée.' : 'Prévenez un responsable de la sécurité si personne ne l’a encore prise en charge.',
                default => $full ? 'À examiner dans la journée.' : 'Pour information ; un responsable l’examinera.',
            },
            'actor' => 'Détection automatique',
            'status' => $anomaly->status(),
            'toReview' => $open && $anomaly->severity() !== Anomaly::INFO,
            'link' => $full ? '/admin/activite-inhabituelle' : null,
        ];
    }

    /** @return array{0: string, 1: string, 2: string} */
    private static function describe(string $action): array
    {
        foreach (self::CATALOGUE as $prefix => $description) {
            if (str_starts_with($action, $prefix)) {
                return $description;
            }
        }

        return ['info', 'Action sensible', 'Pour information.'];
    }

    /** @param array<array<string, mixed>> $recent */
    private static function headline(array $recent, int $toReview): string
    {
        if ($recent === []) {
            return 'Aucun événement de sécurité ces dernières 24 heures.';
        }
        usort($recent, static fn (array $a, array $b): int => (self::SEVERITY_RANK[$a['severity']] ?? 3) <=> (self::SEVERITY_RANK[$b['severity']] ?? 3));
        $worst = $recent[0];

        return sprintf(
            '%d événement%s en 24 h%s. Le plus important : %s.',
            count($recent),
            count($recent) > 1 ? 's' : '',
            $toReview > 0 ? sprintf(', dont %d à examiner', $toReview) : '',
            mb_strtolower(mb_substr((string) $worst['title'], 0, 1)).mb_substr((string) $worst['title'], 1),
        );
    }
}
