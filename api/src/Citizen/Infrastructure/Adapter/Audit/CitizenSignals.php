<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Audit;

use Audit\Application\DTO\Security\IntegrityIssue;
use Audit\Application\Ports\Provider\CitizenSignalsProvider;
use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Port d'Audit (F85) implémenté par Citizen : contrôles de cohérence sur ses propres tables et rafales d'envois.
 * Le catalogue des services est lu par le port de Citizen vers Administration (`MunicipalServiceDirectory`).
 * Aucune donnée personnelle dans les éléments liés : références de demande, de rendez-vous, noms de service.
 */
final readonly class CitizenSignals implements CitizenSignalsProvider
{
    private const LIMIT = 20;

    public function __construct(private EntityManagerInterface $manager, private MunicipalServiceDirectory $services) {}

    public function integrityIssues(\DateTimeImmutable $now): array
    {
        $db = $this->manager->getConnection();
        $issues = [];

        // Demande close (résolue ou refusée) sans étape de clôture enregistrée.
        foreach ($db->fetchAllAssociative(
            "SELECT reference, status FROM citizen_service_requests
             WHERE status IN ('resolved', 'rejected') AND (steps IS NULL OR JSON_LENGTH(steps) < 2) LIMIT ".self::LIMIT,
        ) as $row) {
            $issues[] = new IntegrityIssue(
                'request.closed_without_step|'.$row['reference'],
                'integrity.request_closed_without_step',
                'integrity',
                'warning',
                'Demande close sans étape',
                sprintf('La demande %s est %s mais son historique ne contient aucune étape de clôture : l’habitant ne voit pas pourquoi elle a été fermée.', $row['reference'], $row['status'] === 'resolved' ? 'résolue' : 'refusée'),
                [['type' => 'demande', 'id' => (string) $row['reference'], 'label' => 'Demande '.$row['reference']]],
            );
        }

        // Rendez-vous à venir sur un service désactivé (F63).
        $disabled = [];
        foreach ($this->services->all() as $service) {
            if ($service->disabled) {
                $disabled[$service->id] = $service->name;
            }
        }
        if ($disabled !== []) {
            $ids = array_keys($disabled);
            foreach ($db->fetchAllAssociative(
                sprintf("SELECT reference, service_id, starts_at FROM citizen_appointments WHERE status = 'confirmed' AND starts_at > ? AND service_id IN (%s) ORDER BY starts_at LIMIT %d", implode(', ', array_fill(0, count($ids), '?')), self::LIMIT),
                [$now->format('Y-m-d H:i:s'), ...$ids],
            ) as $row) {
                $issues[] = new IntegrityIssue(
                    'appointment.disabled_service|'.$row['reference'],
                    'integrity.appointment_disabled_service',
                    'integrity',
                    'warning',
                    'Rendez-vous sur un service désactivé',
                    sprintf('Le rendez-vous %s du %s est confirmé alors que le service « %s » est désactivé : prévenez l’habitant ou proposez un autre service.', $row['reference'], (new \DateTimeImmutable((string) $row['starts_at']))->format('d/m/Y à H:i'), $disabled[$row['service_id']] ?? $row['service_id']),
                    [['type' => 'rendez-vous', 'id' => (string) $row['reference'], 'label' => 'Rendez-vous '.$row['reference']], ['type' => 'service', 'id' => (string) $row['service_id'], 'label' => $disabled[$row['service_id']] ?? (string) $row['service_id']]],
                );
            }
        }

        // Références en double (une référence doit désigner un seul dossier).
        foreach (['citizen_service_requests' => 'demande', 'citizen_concerns' => 'inquiétude', 'citizen_appointments' => 'rendez-vous'] as $table => $label) {
            foreach ($db->fetchAllAssociative(sprintf('SELECT reference, COUNT(*) AS copies FROM %s GROUP BY reference HAVING COUNT(*) > 1 LIMIT %d', $table, self::LIMIT)) as $row) {
                $issues[] = new IntegrityIssue(
                    'duplicate.'.$table.'|'.$row['reference'],
                    'integrity.duplicate_reference',
                    'integrity',
                    'critical',
                    'Référence en double',
                    sprintf('La référence %s désigne %d dossiers (%s) : l’habitant et les agents risquent de confondre deux dossiers.', $row['reference'], (int) $row['copies'], $label),
                    [['type' => $label, 'id' => (string) $row['reference'], 'label' => ucfirst($label).' '.$row['reference']]],
                );
            }
        }

        // Compteurs négatifs ou incohérents.
        foreach ($db->fetchAllAssociative('SELECT reference FROM citizen_service_requests WHERE version < 0 LIMIT '.self::LIMIT) as $row) {
            $issues[] = new IntegrityIssue('request.negative_version|'.$row['reference'], 'integrity.negative_counter', 'integrity', 'warning', 'Compteur négatif', sprintf('Le compteur de versions de la demande %s est négatif.', $row['reference']), [['type' => 'demande', 'id' => (string) $row['reference'], 'label' => 'Demande '.$row['reference']]]);
        }
        $orphans = (int) $db->fetchOne('SELECT COUNT(*) FROM citizen_request_supports s LEFT JOIN citizen_service_requests r ON r.id = s.request_id WHERE r.id IS NULL');
        if ($orphans > 0) {
            $issues[] = new IntegrityIssue('supports.orphans', 'integrity.orphan_supports', 'integrity', 'info', 'Soutiens sans demande', sprintf('%d soutien(s) visent une demande qui n’existe plus : le nombre de soutiens affiché peut être faux.', $orphans));
        }
        $slots = (int) $db->fetchOne("SELECT COUNT(*) FROM citizen_appointment_slots s LEFT JOIN citizen_appointments a ON a.id = s.appointment_id AND a.status = 'confirmed' WHERE s.appointment_id IS NOT NULL AND a.id IS NULL");
        if ($slots > 0) {
            $issues[] = new IntegrityIssue('slots.orphans', 'integrity.slot_without_appointment', 'integrity', 'warning', 'Créneaux bloqués sans rendez-vous', sprintf('%d créneau(x) sont marqués réservés sans rendez-vous confirmé : ils ne sont plus proposés aux habitants.', $slots));
        }

        return $issues;
    }

    public function submissionBursts(\DateTimeImmutable $since, int $threshold): array
    {
        $rows = $this->manager->getConnection()->fetchAllAssociative(
            'SELECT citizen_id, SUM(n) AS total FROM (
                SELECT citizen_id, COUNT(*) AS n FROM citizen_service_requests WHERE created_at >= :since GROUP BY citizen_id
                UNION ALL
                SELECT citizen_id, COUNT(*) AS n FROM citizen_concerns WHERE created_at >= :since GROUP BY citizen_id
             ) AS t GROUP BY citizen_id HAVING SUM(n) >= :threshold ORDER BY total DESC LIMIT 20',
            ['since' => $since->format('Y-m-d H:i:s'), 'threshold' => max(1, $threshold)],
        );

        return array_map(static fn (array $row): IntegrityIssue => new IntegrityIssue(
            'citizen.burst|'.$row['citizen_id'],
            'submissions.citizen_burst',
            'abuse',
            (int) $row['total'] >= 3 * $threshold ? 'critical' : 'warning',
            'Rafale d’envois d’un habitant',
            sprintf('Un même habitant a envoyé %d demandes ou inquiétudes en une heure. Vérifiez qu’il ne s’agit pas de doublons ou d’un compte détourné avant de traiter la file.', (int) $row['total']),
            [['type' => 'habitant', 'id' => (string) $row['citizen_id'], 'label' => 'Habitant '.substr((string) $row['citizen_id'], 0, 8)]],
        ), $rows);
    }

    public function suspendedAccountIds(): array
    {
        return array_map('strval', $this->manager->getConnection()->fetchFirstColumn("SELECT user_id FROM citizens WHERE status = 'suspended' LIMIT 500"));
    }
}
