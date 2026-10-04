<?php

declare(strict_types=1);

namespace Pilotage\Infrastructure\Export;

use Pilotage\Application\Ports\Provider\Activity\AccountSecurityActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\AdministrationActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\CitizenActivityProvider;
use Pilotage\Application\Ports\Provider\Activity\CommunicationActivityProvider;
use Pilotage\Application\Ports\Provider\Export\ExportColumn;
use Pilotage\Application\Ports\Provider\Export\ExportCriteria;
use Pilotage\Application\Ports\Provider\Export\ExportDataset;
use Pilotage\Application\Ports\Provider\Export\ExportDataSource;
use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Shared\Application\Ports\Service\IClock;

/**
 * F88 : jeux de données propres à Pilotage — suivi des demandes Webcup (table `pilotage_request_tracking`)
 * et instantané du tableau de bord de l'activité (chiffres obtenus par les ports Activity, comme F50).
 */
final readonly class PilotageExportDataSource implements ExportDataSource
{
    private const REQUEST_STATUSES = ['submitted' => 'Reçues', 'acknowledged' => 'Prises en compte', 'in_progress' => 'En cours', 'resolved' => 'Résolues', 'rejected' => 'Refusées'];
    private const TRACKING_STATUSES = ['todo' => 'À faire', 'in_progress' => 'En cours', 'done' => 'Terminée'];

    public function __construct(
        private RequestTrackingRepository $tracking,
        private CitizenActivityProvider $citizens,
        private CommunicationActivityProvider $communication,
        private AccountSecurityActivityProvider $security,
        private AdministrationActivityProvider $administration,
        private IClock $clock,
    ) {}

    public function datasets(): array
    {
        return [
            new ExportDataset('webcup-tracking', 'Suivi Webcup', 'Suivi interne par l’équipe des demandes du concours.', [
                new ExportColumn('requestCode', 'Demande'),
                new ExportColumn('status', 'Statut'),
                new ExportColumn('note', 'Note'),
                new ExportColumn('links', 'Liens'),
                new ExportColumn('updatedAt', 'Mise à jour le'),
                new ExportColumn('updatedBy', 'Mise à jour par'),
            ], self::TRACKING_STATUSES, 'Date de mise à jour'),
            new ExportDataset('activity', 'Activité (tableau de bord)', 'Chiffres clés de la plateforme au moment de l’export (sans période).', [
                new ExportColumn('section', 'Rubrique'),
                new ExportColumn('indicator', 'Indicateur'),
                new ExportColumn('value', 'Valeur'),
            ], [], null),
        ];
    }

    public function rows(string $dataset, ExportCriteria $criteria): array
    {
        return match ($dataset) {
            'webcup-tracking' => $this->tracking($criteria),
            'activity' => array_slice($this->activity(), 0, $criteria->limit),
            default => [],
        };
    }

    /** @return list<array<string, mixed>> */
    private function tracking(ExportCriteria $criteria): array
    {
        $rows = [];
        foreach ($this->tracking->all() as $tracking) {
            $view = $tracking->view();
            $updatedAt = new \DateTimeImmutable($view['updatedAt']);
            if (($criteria->from !== null && $updatedAt < $criteria->from)
                || ($criteria->until !== null && $updatedAt >= $criteria->until)
                || ($criteria->status !== null && $view['status'] !== $criteria->status)) {
                continue;
            }
            $rows[] = [
                'requestCode' => $view['requestCode'],
                'status' => self::TRACKING_STATUSES[$view['status']] ?? $view['status'],
                'note' => $view['note'],
                'links' => implode(' | ', array_map(static fn (array $link): string => $link['label'].' : '.$link['url'], $view['links'])),
                'updatedAt' => $updatedAt->format('Y-m-d H:i'),
                'updatedBy' => $view['updatedBy'],
            ];
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['updatedAt'], (string) $a['updatedAt']));

        return array_slice($rows, 0, $criteria->limit);
    }

    /** @return list<array<string, mixed>> */
    private function activity(): array
    {
        $now = $this->clock->now();
        $since = $now->modify('-24 hours');
        $citizens = $this->citizens->citizenActivity($since);
        $communication = $this->communication->communicationActivity($now);
        $security = $this->security->accountSecurityActivity($since);
        $administration = $this->administration->administrationActivity();
        $line = static fn (string $section, string $indicator, int|string|null $value): array => ['section' => $section, 'indicator' => $indicator, 'value' => $value];
        $rows = [
            $line('Demandes', 'En attente de prise en charge', $citizens->waitingRequests),
            $line('Demandes', 'Ouvertes', $citizens->openRequests),
            $line('Demandes', 'Déposées ces dernières 24 h', $citizens->newRequests),
            $line('Demandes', 'Plus ancienne en attente depuis', $citizens->oldestWaitingSince?->format('Y-m-d H:i')),
        ];
        foreach ($citizens->requestsByStatus as $status => $count) {
            $rows[] = $line('Demandes par statut', self::REQUEST_STATUSES[$status] ?? $status, $count);
        }

        return [
            ...$rows,
            $line('Habitants', 'Comptes actifs', $citizens->activeCitizens),
            $line('Habitants', 'Comptes suspendus', $citizens->suspendedCitizens),
            $line('Habitants', 'Inscrits ces dernières 24 h', $citizens->newCitizens),
            $line('Communication', 'Alertes en cours', $communication->activeAlerts),
            $line('Communication', 'Alertes critiques', $communication->criticalAlerts),
            $line('Communication', 'Alertes programmées', $communication->scheduledAlerts),
            $line('Communication', 'Publications en ligne', $communication->publishedPublications),
            $line('Communication', 'Brouillons', $communication->draftPublications),
            $line('Sécurité', 'Comptes suspendus', $security->suspendedAccounts),
            $line('Sécurité', 'Connexions bloquées', $security->blockedLogins),
            $line('Administration', 'Membres actifs', $administration->activeMembers),
            $line('Administration', 'Services', $administration->services),
            $line('Administration', 'Services perturbés', $administration->disruptedServices),
            $line('Export', 'Généré le', $now->format('Y-m-d H:i')),
        ];
    }
}
