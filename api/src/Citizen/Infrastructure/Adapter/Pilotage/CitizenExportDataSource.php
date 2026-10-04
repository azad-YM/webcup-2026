<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Pilotage;

use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\Ports\Provider\Export\ExportColumn;
use Pilotage\Application\Ports\Provider\Export\ExportCriteria;
use Pilotage\Application\Ports\Provider\Export\ExportDataset;
use Pilotage\Application\Ports\Provider\Export\ExportDataSource;

/**
 * F88 : port `ExportDataSource` de Pilotage implémenté par Citizen, sur ses seules tables :
 * demandes citoyennes, rendez-vous et inquiétudes. Nom de l'habitant, description, message et lieu précis sont sensibles.
 * Téléphone et adresse (chiffrés) ne sont jamais exportés.
 */
final readonly class CitizenExportDataSource implements ExportDataSource
{
    private const REQUEST_STATUSES = ['submitted' => 'Reçue', 'acknowledged' => 'Prise en compte', 'in_progress' => 'En cours', 'resolved' => 'Résolue', 'rejected' => 'Refusée'];
    private const APPOINTMENT_STATUSES = ['confirmed' => 'Confirmé', 'cancelled' => 'Annulé'];
    private const CONCERN_STATUSES = ['received' => 'Reçue', 'in_review' => 'En cours d’examen', 'answered' => 'Répondue'];
    private const PRIORITIES = ['urgent' => 'Urgente', 'high' => 'Haute', 'normal' => 'Normale', 'low' => 'Basse'];
    private const TYPES = ['contact' => 'Prise de contact', 'report' => 'Signalement'];

    public function __construct(private EntityManagerInterface $manager, private MunicipalServiceDirectory $services) {}

    public function datasets(): array
    {
        return [
            new ExportDataset('requests', 'Demandes citoyennes', 'Demandes et signalements déposés par les habitants, avec leur suivi.', [
                new ExportColumn('reference', 'Numéro'),
                new ExportColumn('createdAt', 'Déposée le'),
                new ExportColumn('updatedAt', 'Mise à jour le', selected: false),
                new ExportColumn('type', 'Type'),
                new ExportColumn('category', 'Catégorie'),
                new ExportColumn('service', 'Service'),
                new ExportColumn('subject', 'Objet'),
                new ExportColumn('status', 'Statut'),
                new ExportColumn('priority', 'Priorité'),
                new ExportColumn('district', 'Quartier'),
                new ExportColumn('isPublic', 'Publique', selected: false),
                new ExportColumn('medicalEmergency', 'Urgence médicale', selected: false),
                new ExportColumn('citizenName', 'Habitant', sensitive: true),
                new ExportColumn('location', 'Lieu précis', sensitive: true),
                new ExportColumn('description', 'Description', sensitive: true),
            ], self::REQUEST_STATUSES),
            new ExportDataset('appointments', 'Rendez-vous', 'Rendez-vous pris par les habitants auprès des services.', [
                new ExportColumn('reference', 'Numéro'),
                new ExportColumn('startsAt', 'Date du rendez-vous'),
                new ExportColumn('duration', 'Durée (minutes)'),
                new ExportColumn('service', 'Service'),
                new ExportColumn('location', 'Lieu'),
                new ExportColumn('status', 'Statut'),
                new ExportColumn('createdAt', 'Pris le', selected: false),
                new ExportColumn('citizenName', 'Habitant', sensitive: true),
            ], self::APPOINTMENT_STATUSES, 'Date du rendez-vous'),
            new ExportDataset('concerns', 'Inquiétudes', 'Inquiétudes exprimées par les habitants et réponses de la mairie.', [
                new ExportColumn('reference', 'Numéro'),
                new ExportColumn('createdAt', 'Reçue le'),
                new ExportColumn('topic', 'Sujet'),
                new ExportColumn('subject', 'Objet'),
                new ExportColumn('status', 'Statut'),
                new ExportColumn('updatedAt', 'Mise à jour le', selected: false),
                new ExportColumn('response', 'Réponse de la mairie', selected: false),
                new ExportColumn('citizenName', 'Habitant', sensitive: true),
                new ExportColumn('message', 'Message', sensitive: true),
            ], self::CONCERN_STATUSES),
        ];
    }

    public function rows(string $dataset, ExportCriteria $criteria): array
    {
        return match ($dataset) {
            'requests' => $this->requests($criteria),
            'appointments' => $this->appointments($criteria),
            'concerns' => $this->concerns($criteria),
            default => [],
        };
    }

    /** @return list<array<string, mixed>> */
    private function requests(ExportCriteria $criteria): array
    {
        $services = [];
        foreach ($this->services->all() as $service) {
            $services[$service->id] = $service->name;
        }
        $rows = [];
        foreach ($this->fetch('SELECT r.*, c.first_name, c.last_name FROM citizen_service_requests r LEFT JOIN citizens c ON c.id = r.citizen_id', 'r.created_at', 'r.status', $criteria) as $row) {
            $rows[] = [
                'reference' => $row['reference'],
                'createdAt' => self::date($row['created_at']),
                'updatedAt' => self::date($row['updated_at']),
                'type' => self::TYPES[$row['type']] ?? $row['type'],
                'category' => $row['category'],
                'service' => $row['service_id'] !== null ? ($services[$row['service_id']] ?? $row['service_id']) : null,
                'subject' => $row['subject'],
                'status' => self::REQUEST_STATUSES[$row['status']] ?? $row['status'],
                'priority' => self::PRIORITIES[$row['priority']] ?? $row['priority'],
                'district' => $row['district'],
                'isPublic' => (bool) $row['is_public'],
                'medicalEmergency' => (bool) $row['medical_emergency'],
                'citizenName' => self::name($row),
                'location' => $row['location'],
                'description' => $row['description'],
            ];
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function appointments(ExportCriteria $criteria): array
    {
        $rows = [];
        foreach ($this->fetch('SELECT a.*, c.first_name, c.last_name FROM citizen_appointments a LEFT JOIN citizens c ON c.id = a.citizen_id', 'a.starts_at', 'a.status', $criteria) as $row) {
            $rows[] = [
                'reference' => $row['reference'],
                'startsAt' => self::date($row['starts_at']),
                'duration' => (int) $row['duration_minutes'],
                'service' => $row['service_name'],
                'location' => $row['location'],
                'status' => self::APPOINTMENT_STATUSES[$row['status']] ?? $row['status'],
                'createdAt' => self::date($row['created_at']),
                'citizenName' => self::name($row),
            ];
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function concerns(ExportCriteria $criteria): array
    {
        $rows = [];
        foreach ($this->fetch('SELECT i.*, c.first_name, c.last_name FROM citizen_concerns i LEFT JOIN citizens c ON c.id = i.citizen_id', 'i.created_at', 'i.status', $criteria) as $row) {
            $rows[] = [
                'reference' => $row['reference'],
                'createdAt' => self::date($row['created_at']),
                'topic' => $row['topic'],
                'subject' => $row['subject'],
                'status' => self::CONCERN_STATUSES[$row['status']] ?? $row['status'],
                'updatedAt' => self::date($row['updated_at']),
                'response' => $row['response'],
                'citizenName' => self::name($row),
                'message' => $row['message'],
            ];
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function fetch(string $select, string $dateColumn, string $statusColumn, ExportCriteria $criteria): array
    {
        $where = [];
        $params = [];
        if ($criteria->sqlFrom() !== null) {
            $where[] = $dateColumn.' >= ?';
            $params[] = $criteria->sqlFrom();
        }
        if ($criteria->sqlUntil() !== null) {
            $where[] = $dateColumn.' < ?';
            $params[] = $criteria->sqlUntil();
        }
        if ($criteria->status !== null) {
            $where[] = $statusColumn.' = ?';
            $params[] = $criteria->status;
        }
        $sql = $select.($where !== [] ? ' WHERE '.implode(' AND ', $where) : '').sprintf(' ORDER BY %s DESC LIMIT %d', $dateColumn, max(1, $criteria->limit));

        return $this->manager->getConnection()->fetchAllAssociative($sql, $params);
    }

    private static function date(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? substr($value, 0, 16) : null;
    }

    /** @param array<string, mixed> $row */
    private static function name(array $row): ?string
    {
        $name = trim(((string) ($row['first_name'] ?? '')).' '.((string) ($row['last_name'] ?? '')));

        return $name !== '' ? $name : null;
    }
}
