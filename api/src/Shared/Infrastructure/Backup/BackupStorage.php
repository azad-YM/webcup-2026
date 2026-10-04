<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F87 (ADR 012) : emplacement des sauvegardes et des rapports, **hors du dossier public** (`BACKUP_DIR`,
 * par défaut `var/backups`, ignoré par git). Dossiers en 0700, fichiers en 0600.
 *
 * ```text
 * <BACKUP_DIR>/<id>/manifest.json            tables, lignes, tailles, sommes SHA-256, colonnes
 * <BACKUP_DIR>/<id>/<table>.ndjson.gz        une ligne JSON par enregistrement
 * <BACKUP_DIR>/reports/<id>-<type>.json      rapports de sauvegarde (run) et de vérification (verify)
 * ```
 */
final readonly class BackupStorage
{
    public function __construct(
        #[Autowire('%env(BACKUP_DIR)%')] private string $directory,
        #[Autowire('%env(int:BACKUP_RETENTION)%')] private int $retention = 7,
    ) {}

    public function root(): string
    {
        return rtrim($this->directory, '/');
    }

    public function retention(): int
    {
        return max(1, $this->retention);
    }

    public function backupDir(string $id): string
    {
        return $this->root().'/'.self::safeId($id);
    }

    public function ensureDir(string $path): void
    {
        if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
            throw new \RuntimeException(sprintf('Impossible de créer le dossier de sauvegarde « %s ».', $path));
        }
    }

    /** @return list<string> identifiants des sauvegardes, du plus récent au plus ancien */
    public function backups(): array
    {
        $ids = [];
        foreach (glob($this->root().'/*/manifest.json') ?: [] as $manifest) {
            $ids[] = basename(dirname($manifest));
        }
        rsort($ids);

        return $ids;
    }

    /** @return array<string, mixed>|null */
    public function manifest(string $id): ?array
    {
        $file = $this->backupDir($id).'/manifest.json';
        $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        return is_array($data) ? $data : null;
    }

    /** @param array<string, mixed> $report */
    public function saveReport(array $report): void
    {
        $dir = $this->root().'/reports';
        $this->ensureDir($dir);
        $file = sprintf('%s/%s-%s.json', $dir, self::safeId((string) $report['id']), $report['type']);
        file_put_contents($file, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        @chmod($file, 0600);
    }

    /** @return list<array<string, mixed>> rapports du plus récent au plus ancien */
    public function reports(int $limit = 30): array
    {
        $files = glob($this->root().'/reports/*.json') ?: [];
        usort($files, static fn (string $a, string $b): int => filemtime($b) <=> filemtime($a) ?: strcmp($b, $a));
        $reports = [];
        foreach (array_slice($files, 0, $limit) as $file) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data)) {
                $reports[] = $data;
            }
        }

        return $reports;
    }

    /** Supprime les sauvegardes au-delà de la rétention ; renvoie les identifiants supprimés. */
    public function prune(): array
    {
        $removed = [];
        foreach (array_slice($this->backups(), $this->retention()) as $id) {
            $dir = $this->backupDir($id);
            foreach (glob($dir.'/*') ?: [] as $file) {
                @unlink($file);
            }
            @rmdir($dir);
            $removed[] = $id;
        }
        // Rapports : on en garde quatre fois plus que de sauvegardes (historique des vérifications).
        $reports = glob($this->root().'/reports/*.json') ?: [];
        rsort($reports);
        foreach (array_slice($reports, $this->retention() * 4) as $file) {
            @unlink($file);
        }

        return $removed;
    }

    public function usedBytes(): int
    {
        $total = 0;
        foreach (glob($this->root().'/*/*') ?: [] as $file) {
            $total += is_file($file) ? (int) filesize($file) : 0;
        }

        return $total;
    }

    public static function safeId(string $id): string
    {
        if (preg_match('/^[0-9TZ-]{15,25}$/', $id) !== 1) {
            throw new \InvalidArgumentException('Identifiant de sauvegarde invalide.');
        }

        return $id;
    }
}
