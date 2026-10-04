<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup\Http;

use Shared\Application\Ports\Provider\OperationsAccessPolicy;
use Shared\Infrastructure\Backup\BackupStorage;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * F87 : rapports de sauvegarde et de vérification pour l'écran « Sauvegardes » de l'admin (`admin.backup.read`).
 * Lecture seule : les sauvegardes se lancent par la tâche planifiée ou en ligne de commande, jamais par l'API.
 * Aucun contenu de table n'est exposé, seulement les métadonnées (tables, lignes, tailles, verdicts).
 */
final readonly class BackupController
{
    public function __construct(private BackupStorage $storage, private OperationsAccessPolicy $access) {}

    #[Route('/api/platform/backups', name: 'shared_backup_reports', methods: ['GET'])]
    public function reports(): JsonResponse
    {
        if (!$this->access->canReadBackups()) {
            return new JsonResponse(['error' => 'Accès réservé aux administrateurs autorisés à consulter les sauvegardes.'], 403);
        }
        $reports = $this->storage->reports(30);
        $lastRun = null;
        $lastVerify = null;
        foreach ($reports as $report) {
            if ($report['type'] === 'run' && $lastRun === null) {
                $lastRun = $report;
            }
            if ($report['type'] === 'verify' && $lastVerify === null) {
                $lastVerify = $report;
            }
        }

        return new JsonResponse([
            'reports' => $reports,
            'lastRun' => $lastRun,
            'lastVerify' => $lastVerify,
            'storage' => [
                'backups' => count($this->storage->backups()),
                'bytes' => $this->storage->usedBytes(),
                'retention' => $this->storage->retention(),
            ],
        ]);
    }
}
