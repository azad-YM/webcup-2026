<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetActivityReport;

use Pilotage\Application\DTO\Report\RequestReport;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Ports\Provider\Report\CitizenReportProvider;
use Pilotage\Application\Ports\Provider\Report\CommunicationReportProvider;
use Pilotage\Application\Ports\Provider\Report\ParticipationReportProvider;
use Pilotage\Application\Ports\Provider\Report\SecurityReportProvider;
use Pilotage\Application\Service\ReportPeriod;
use Pilotage\Application\Service\ServiceUsageAnalysis;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F103 : rapport synthétique de l'activité de la plateforme, pour les responsables.
 *
 * Chaque chiffre vient de son BC propriétaire (ports Pilotage, comptes seulement) et est comparé à la période
 * précédente de même durée. Le rapport ne s'arrête pas aux données brutes : `keyPoints` dit ce qu'il faut retenir,
 * `recommendations` ce qu'il faudrait faire, à partir de règles explicites (délai de prise en charge, demandes en
 * attente, services sous tension, alertes, sécurité).
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetActivityReportHandler
{
    /** Au-delà, le délai moyen de prise en charge est signalé comme trop long. */
    public const SLOW_ACKNOWLEDGE_HOURS = 48.0;

    public function __construct(
        private PilotageAccessPolicy $access,
        private CitizenReportProvider $citizens,
        private CommunicationReportProvider $communication,
        private ParticipationReportProvider $participation,
        private SecurityReportProvider $security,
        private ServiceUsageAnalysis $usage,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(GetActivityReportQuery $query): array
    {
        if (!$this->access->canReadActivityDashboard()) {
            throw new AccessDeniedException('The activity report requires the admin.pilotage.read permission.');
        }
        $now = $this->clock->now();
        [$from, $to] = ReportPeriod::resolve($query->days, $query->from, $query->to, $now);
        $previousFrom = $from->sub($from->diff($to));
        $requests = $this->citizens->requestReport($from, $to);
        $before = $this->citizens->requestReport($previousFrom, $from);
        $communication = $this->communication->communicationReport($from, $to);
        $participation = $this->participation->participationReport($from, $to);
        $security = $this->security->securityReport($from, $to);
        $usage = $this->usage->analyse($from, $to);
        $handled = $requests->resolved + $requests->rejected;

        $figures = [
            ['key' => 'requests', 'label' => 'Demandes reçues', 'value' => $requests->received, 'previous' => $before->received, 'trend' => self::trend($requests->received, $before->received)],
            ['key' => 'handled', 'label' => 'Demandes traitées', 'value' => $handled, 'previous' => $before->resolved + $before->rejected, 'trend' => self::trend($handled, $before->resolved + $before->rejected)],
            ['key' => 'acknowledge', 'label' => 'Délai moyen de prise en charge (h)', 'value' => $requests->averageHoursToAcknowledge, 'previous' => $before->averageHoursToAcknowledge, 'trend' => null],
            ['key' => 'citizens', 'label' => 'Nouveaux habitants inscrits', 'value' => $requests->newCitizens, 'previous' => $before->newCitizens, 'trend' => self::trend($requests->newCitizens, $before->newCitizens)],
            ['key' => 'uses', 'label' => 'Usages des services', 'value' => $usage['totals']['uses'], 'previous' => $usage['totals']['previousUses'], 'trend' => self::trend($usage['totals']['uses'], $usage['totals']['previousUses'])],
            ['key' => 'participation', 'label' => 'Contributions des habitants', 'value' => $participation->contributions + $participation->ideas + $participation->reviews, 'previous' => null, 'trend' => null],
        ];

        return [
            'generatedAt' => $now->format(DATE_ATOM),
            'period' => $usage['period'],
            'figures' => $figures,
            'keyPoints' => self::keyPoints($requests, $before, $handled, $usage, $communication->alerts, $communication->criticalAlerts, $security->blockedLogins),
            'recommendations' => self::recommendations($requests, $usage, $security->blockedLogins),
            'sections' => [
                'requests' => [
                    'received' => $requests->received, 'resolved' => $requests->resolved, 'rejected' => $requests->rejected,
                    'waiting' => $requests->waiting, 'urgent' => $requests->urgent,
                    'handledShare' => $requests->received === 0 ? null : round($handled / $requests->received, 2),
                    'averageHoursToAcknowledge' => $requests->averageHoursToAcknowledge,
                    'appointments' => $requests->appointments, 'concerns' => $requests->concerns,
                ],
                'services' => ['top' => array_slice($usage['services'], 0, 5), 'insights' => $usage['insights'], 'unused' => $usage['unused']],
                'communication' => ['alerts' => $communication->alerts, 'criticalAlerts' => $communication->criticalAlerts, 'publications' => $communication->publications, 'officialMessages' => $communication->officialMessages],
                'participation' => ['contributions' => $participation->contributions, 'ideas' => $participation->ideas, 'reviews' => $participation->reviews, 'averageRating' => $participation->averageRating],
                'security' => ['blockedLogins' => $security->blockedLogins, 'suspendedAccounts' => $security->suspendedAccounts],
            ],
        ];
    }

    private static function trend(int $value, int $previous): ?float
    {
        return $previous === 0 ? null : round(($value - $previous) / $previous, 2);
    }

    /**
     * @param array<string, mixed> $usage
     * @return list<array{tone: string, text: string}>
     */
    private static function keyPoints(RequestReport $requests, RequestReport $before, int $handled, array $usage, int $alerts, int $critical, int $blocked): array
    {
        $points = [];
        $trend = self::trend($requests->received, $before->received);
        $points[] = ['tone' => 'info', 'text' => sprintf(
            '%d demande%s reçue%s%s ; %s traitée%s (résolues ou refusées).',
            $requests->received, $requests->received > 1 ? 's' : '', $requests->received > 1 ? 's' : '',
            $trend === null ? '' : sprintf(' (%s%d %% par rapport à la période précédente)', $trend >= 0 ? '+' : '', (int) round($trend * 100)),
            $requests->received === 0 ? 'aucune' : sprintf('%d %%', (int) round($handled / $requests->received * 100)),
            $requests->received > 1 ? 's' : '',
        )];
        if ($requests->averageHoursToAcknowledge !== null) {
            $slow = $requests->averageHoursToAcknowledge > self::SLOW_ACKNOWLEDGE_HOURS;
            $points[] = ['tone' => $slow ? 'warning' : 'success', 'text' => sprintf('Une demande est prise en charge en %s en moyenne%s.', self::hours($requests->averageHoursToAcknowledge), $slow ? ', au-delà de l’objectif de 48 h' : '')];
        }
        if ($requests->waiting > 0) {
            $points[] = ['tone' => 'warning', 'text' => sprintf('%d demande%s de la période attend%s encore une prise en charge%s.', $requests->waiting, $requests->waiting > 1 ? 's' : '', $requests->waiting > 1 ? 'ent' : '', $requests->urgent > 0 ? sprintf(' (%d urgente%s reçue%s sur la période)', $requests->urgent, $requests->urgent > 1 ? 's' : '', $requests->urgent > 1 ? 's' : '') : '')];
        }
        $top = $usage['services'][0] ?? null;
        if (is_array($top)) {
            $points[] = ['tone' => 'info', 'text' => sprintf('Service le plus utilisé : « %s » (%d usages, %d %% du total).', $top['name'], $top['uses'], (int) round($top['share'] * 100))];
        }
        if ($alerts > 0) {
            $points[] = ['tone' => $critical > 0 ? 'warning' : 'info', 'text' => sprintf('%d alerte%s diffusée%s aux habitants, dont %d urgente%s.', $alerts, $alerts > 1 ? 's' : '', $alerts > 1 ? 's' : '', $critical, $critical > 1 ? 's' : '')];
        }
        if ($requests->newCitizens > 0) {
            $points[] = ['tone' => 'success', 'text' => $requests->newCitizens > 1 ? sprintf('%d nouveaux habitants inscrits.', $requests->newCitizens) : '1 nouvel habitant inscrit.'];
        }
        if ($blocked > 0) {
            $points[] = ['tone' => 'warning', 'text' => sprintf('%d tentative%s de connexion suspecte%s bloquée%s.', $blocked, $blocked > 1 ? 's' : '', $blocked > 1 ? 's' : '', $blocked > 1 ? 's' : '')];
        }

        return $points;
    }

    /**
     * @param array<string, mixed> $usage
     * @return list<string>
     */
    private static function recommendations(RequestReport $requests, array $usage, int $blocked): array
    {
        $actions = [];
        if ($requests->averageHoursToAcknowledge !== null && $requests->averageHoursToAcknowledge > self::SLOW_ACKNOWLEDGE_HOURS) {
            $actions[] = 'Réduire le délai de prise en charge : répartir la file des demandes entre davantage d’agents ou répondre d’abord par un accusé de réception.';
        }
        if ($requests->waiting >= 5) {
            $actions[] = sprintf('Traiter en priorité les %d demandes encore en attente, en commençant par les urgentes (file des demandes).', $requests->waiting);
        }
        foreach ($usage['insights'] as $insight) {
            if (isset($insight['action'])) {
                $actions[] = $insight['action'];
            }
        }
        if ($usage['unused'] !== []) {
            $actions[] = 'Mettre en avant ou revoir les services jamais utilisés sur la période (voir « Services les plus utilisés »).';
        }
        if ($blocked >= 10) {
            $actions[] = 'Vérifier l’écran « Activité inhabituelle » : de nombreuses connexions suspectes ont été bloquées.';
        }

        return $actions === [] ? ['Aucune action urgente : l’activité est conforme aux objectifs sur la période.'] : $actions;
    }

    private static function hours(float $hours): string
    {
        if ($hours < 1) {
            return sprintf('%d min', max(1, (int) round($hours * 60)));
        }
        if ($hours < 48) {
            return sprintf('%s h', number_format($hours, $hours < 10 ? 1 : 0, ',', ''));
        }

        return sprintf('%s jours', number_format($hours / 24, 1, ',', ''));
    }
}
