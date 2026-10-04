<?php

declare(strict_types=1);

namespace Pilotage\Application\Service;

use Pilotage\Application\DTO\Report\DirectoryService;
use Pilotage\Application\DTO\Report\ServiceSatisfaction;
use Pilotage\Application\DTO\Report\ServiceUsage;
use Pilotage\Application\Ports\Provider\Report\CitizenReportProvider;
use Pilotage\Application\Ports\Provider\Report\ParticipationReportProvider;
use Pilotage\Application\Ports\Provider\Report\ServiceDirectory;

/**
 * F98 : quels services les habitants utilisent le plus, sous une forme exploitable.
 *
 * Usage d'un service = demandes + rendez-vous sur la période (sources : Citizen) ; complété par les habitants
 * distincts, la note moyenne des avis (Participation) et l'évolution par rapport à la période précédente de même
 * durée. Les constats (« à retenir ») transforment les chiffres en décisions possibles : concentration,
 * progression, service très utilisé mais perturbé ou mal noté, services jamais utilisés (hors urgences et partenaires,
 * qui ne passent pas par les demandes en ligne).
 */
final readonly class ServiceUsageAnalysis
{
    /** Note sous laquelle un service très utilisé devient une priorité d'amélioration. */
    public const LOW_RATING = 3.0;
    /** Progression signalée à partir de +50 % et d'au moins 3 usages. */
    public const GROWTH_SHARE = 0.5;

    public function __construct(
        private CitizenReportProvider $citizens,
        private ParticipationReportProvider $participation,
        private ServiceDirectory $directory,
    ) {}

    /** @return array{period: array<string, mixed>, totals: array<string, int>, services: list<array<string, mixed>>, insights: list<array<string, string>>, unused: list<string>} */
    public function analyse(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $previousFrom = $from->sub($from->diff($to));
        $current = self::byService($this->citizens->serviceUsage($from, $to));
        $previous = self::byService($this->citizens->serviceUsage($previousFrom, $from));
        $satisfaction = [];
        foreach ($this->participation->serviceSatisfaction($from, $to) as $item) {
            $satisfaction[$item->serviceId] = $item;
        }
        $catalogue = [];
        foreach ($this->directory->services() as $service) {
            $catalogue[$service->id] = $service;
        }
        $total = array_sum(array_map(static fn (ServiceUsage $usage): int => $usage->requests + $usage->appointments, $current));
        $rows = [];
        foreach ($current as $id => $usage) {
            $uses = $usage->requests + $usage->appointments;
            $before = isset($previous[$id]) ? $previous[$id]->requests + $previous[$id]->appointments : 0;
            $rows[] = self::row($id, $catalogue[$id] ?? null, $usage, $uses, $before, $total, $satisfaction[$id] ?? null);
        }
        usort($rows, static fn (array $a, array $b): int => [$b['uses'], $b['citizens'], $a['name']] <=> [$a['uses'], $a['citizens'], $b['name']]);
        foreach ($rows as $index => $row) {
            $rows[$index]['rank'] = $index + 1;
        }
        $unused = array_values(array_map(
            static fn (DirectoryService $service): string => $service->name,
            array_filter($catalogue, static fn (DirectoryService $service): bool => !isset($current[$service->id]) && $service->category !== 'partenaires' && !$service->emergency),
        ));

        return [
            'period' => ['from' => $from->format(DATE_ATOM), 'to' => $to->format(DATE_ATOM), 'days' => (int) $from->diff($to)->days, 'previousFrom' => $previousFrom->format(DATE_ATOM)],
            'totals' => [
                'uses' => $total,
                'previousUses' => array_sum(array_map(static fn (ServiceUsage $usage): int => $usage->requests + $usage->appointments, $previous)),
                'requests' => array_sum(array_map(static fn (ServiceUsage $usage): int => $usage->requests, $current)),
                'appointments' => array_sum(array_map(static fn (ServiceUsage $usage): int => $usage->appointments, $current)),
                'servicesUsed' => count($current),
                'servicesInCatalogue' => count($catalogue),
            ],
            'services' => $rows,
            'insights' => self::insights($rows, $total, $unused),
            'unused' => $unused,
        ];
    }

    /** @param list<ServiceUsage> $usages @return array<string, ServiceUsage> */
    private static function byService(array $usages): array
    {
        $result = [];
        foreach ($usages as $usage) {
            $result[$usage->serviceId] = $usage;
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private static function row(string $id, ?DirectoryService $service, ServiceUsage $usage, int $uses, int $before, int $total, ?ServiceSatisfaction $satisfaction): array
    {
        return [
            'serviceId' => $id,
            'name' => $service->name ?? $id,
            'category' => $service->category ?? null,
            'status' => $service === null ? 'unknown' : ($service->disabled ? 'disabled' : $service->status),
            'uses' => $uses,
            'requests' => $usage->requests,
            'appointments' => $usage->appointments,
            'citizens' => $usage->citizens,
            'share' => $total === 0 ? 0.0 : round($uses / $total, 3),
            'previousUses' => $before,
            'trend' => $before === 0 ? null : round(($uses - $before) / $before, 2),
            'reviews' => $satisfaction->reviews ?? 0,
            'averageRating' => $satisfaction?->averageRating,
            'needMetShare' => $satisfaction?->needMetShare,
        ];
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @param list<string> $unused
     * @return list<array{tone: string, title: string, detail: string, action?: string}>
     */
    private static function insights(array $rows, int $total, array $unused): array
    {
        if ($rows === []) {
            return [['tone' => 'info', 'title' => 'Aucun usage sur la période', 'detail' => 'Aucune demande ni aucun rendez-vous n’a été adressé à un service. Élargissez la période.']];
        }
        $insights = [];
        $top = $rows[0];
        $insights[] = ['tone' => 'info', 'title' => sprintf('« %s » est le service le plus utilisé', $top['name']), 'detail' => sprintf(
            '%d usage%s (%d %%), par %d habitant%s.',
            $top['uses'], $top['uses'] > 1 ? 's' : '', (int) round($top['share'] * 100), $top['citizens'], $top['citizens'] > 1 ? 's' : '',
        )];
        $three = array_slice($rows, 0, 3);
        if (count($rows) > 3 && $total > 0) {
            $share = array_sum(array_column($three, 'uses')) / $total;
            if ($share >= 0.6) {
                $insights[] = ['tone' => 'info', 'title' => sprintf('Trois services concentrent %d %% des usages', (int) round($share * 100)), 'detail' => implode(', ', array_column($three, 'name')).' : prioritaires pour l’accueil, les effectifs et l’information.'];
            }
        }
        foreach ($rows as $row) {
            if ($row['trend'] !== null && $row['trend'] >= self::GROWTH_SHARE && $row['uses'] >= 3) {
                $insights[] = ['tone' => 'warning', 'title' => sprintf('Forte hausse pour « %s »', $row['name']), 'detail' => sprintf('+%d %% par rapport à la période précédente (%d → %d). Vérifiez les délais de réponse.', (int) round($row['trend'] * 100), $row['previousUses'], $row['uses'])];
                break;
            }
        }
        foreach (array_slice($rows, 0, 5) as $row) {
            if (in_array($row['status'], ['maintenance', 'incident', 'disabled'], true)) {
                $insights[] = ['tone' => 'danger', 'title' => sprintf('« %s » est très utilisé mais perturbé', $row['name']), 'detail' => 'Les habitants en ont besoin : informez-les de l’alternative et du retour prévu sur la fiche du service.', 'action' => sprintf('Rétablir en priorité « %s » ou, en attendant, publier sur sa fiche une alternative et une date de retour.', $row['name'])];
            }
            if ($row['averageRating'] !== null && $row['averageRating'] < self::LOW_RATING && $row['reviews'] >= 2) {
                $insights[] = ['tone' => 'danger', 'title' => sprintf('« %s » : beaucoup utilisé, peu apprécié', $row['name']), 'detail' => sprintf('Note moyenne %s / 5 sur %d avis : priorité d’amélioration.', number_format($row['averageRating'], 1, ',', ''), $row['reviews']), 'action' => sprintf('Lire les avis sur « %s » (Participation › Avis sur les services) et y répondre : c’est un service très utilisé mais mal noté.', $row['name'])];
            }
        }
        if ($unused !== []) {
            $insights[] = ['tone' => 'neutral', 'title' => sprintf('%d service%s sans aucun usage', count($unused), count($unused) > 1 ? 's' : ''), 'detail' => implode(', ', array_slice($unused, 0, 6)).(count($unused) > 6 ? '…' : '').' : peu connus, mal nommés ou inutiles ? À mettre en avant ou à revoir.'];
        }

        return $insights;
    }
}
