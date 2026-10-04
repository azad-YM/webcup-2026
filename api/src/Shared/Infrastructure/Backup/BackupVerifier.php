<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup;

use Doctrine\DBAL\Connection;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F87 (ADR 012) : vérifie qu'une sauvegarde peut réellement être restaurée et produit un rapport clair.
 *
 * Pour chaque table : fichier présent, somme SHA-256 identique, archive lisible, une ligne JSON valide par
 * enregistrement avec les colonnes attendues, nombre de lignes égal au manifeste, schéma comparé à la base
 * actuelle. Puis **restauration d'essai** dans une table temporaire (`CREATE TEMPORARY TABLE … LIKE …`, visible
 * de cette seule connexion et détruite à la fin) et recomptage. Si le serveur refuse les tables temporaires, la
 * vérification se limite à la relecture (verdict « à surveiller »). Rien n'est écrit dans les tables réelles.
 *
 * Verdict : `ok` (tout concorde), `warning` (à surveiller : schéma changé depuis, restauration d'essai
 * impossible ou partielle, sauvegarde ancienne), `failed` (échec : fichier manquant ou altéré, lignes perdues).
 */
final readonly class BackupVerifier
{
    private const INSERT_BATCH = 200;

    public function __construct(
        private Connection $connection,
        private BackupStorage $storage,
        private BackupRunner $runner,
        #[Autowire('%env(int:BACKUP_RESTORE_MAX_ROWS)%')] private int $restoreMaxRows = 200000,
        #[Autowire('%env(int:BACKUP_MAX_AGE_HOURS)%')] private int $maxAgeHours = 36,
    ) {}

    /** @return array<string, mixed> rapport de vérification */
    public function verify(?string $backupId = null): array
    {
        $started = microtime(true);
        $backupId ??= $this->storage->backups()[0] ?? null;
        $report = [
            'id' => gmdate('Ymd\THis\Z'),
            'type' => 'verify',
            'backupId' => $backupId,
            'startedAt' => gmdate(DATE_ATOM, (int) $started),
        ];
        $manifest = $backupId !== null ? $this->storage->manifest($backupId) : null;
        if ($manifest === null) {
            return $this->finish($report + [
                'verdict' => 'failed',
                'summary' => $backupId === null ? 'Aucune sauvegarde à vérifier : lancez d’abord une sauvegarde.' : 'Le manifeste de la sauvegarde est introuvable ou illisible.',
                'totals' => ['tables' => 0, 'rows' => 0, 'bytes' => 0],
                'tables' => [],
                'issues' => ['Sauvegarde introuvable.'],
                'restoreMode' => null,
            ], $started);
        }

        $dir = $this->storage->backupDir((string) $backupId);
        $existing = array_flip($this->connection->createSchemaManager()->listTableNames());
        $restoreMode = 'temporary_tables';
        $tables = [];
        $issues = [];
        $failed = false;
        $warning = false;
        $rows = 0;
        $bytes = 0;

        foreach ($manifest['tables'] as $name => $entry) {
            $line = ['name' => $name, 'bc' => $entry['bc'] ?? '', 'rows' => (int) ($entry['rows'] ?? 0), 'bytes' => (int) ($entry['bytes'] ?? 0), 'status' => 'ok', 'notes' => ''];
            if ($entry['missing'] ?? false) {
                $line['status'] = 'warning';
                $line['notes'] = 'Table absente au moment de la sauvegarde.';
                $warning = true;
                $tables[] = $line;
                continue;
            }
            $check = $this->checkTable($dir, (string) $name, $entry, isset($existing[$name]), $restoreMode);
            $line['status'] = $check['status'];
            $line['notes'] = implode(' ', $check['notes']);
            foreach ($check['notes'] as $note) {
                if ($check['status'] !== 'ok') {
                    $issues[] = sprintf('%s : %s', $name, $note);
                }
            }
            $failed = $failed || $check['status'] === 'failed';
            $warning = $warning || $check['status'] === 'warning';
            $rows += $line['rows'];
            $bytes += $line['bytes'];
            $tables[] = $line;
        }

        $ageHours = (time() - (int) strtotime((string) $manifest['createdAt'])) / 3600;
        if ($ageHours > $this->maxAgeHours) {
            $warning = true;
            $issues[] = sprintf('La dernière sauvegarde date de plus de %d heures : vérifiez la tâche planifiée.', $this->maxAgeHours);
        }
        if ($restoreMode === 'reread_only') {
            $issues[] = 'Le serveur refuse les tables temporaires : la restauration d’essai a été remplacée par une relecture complète.';
        }
        $verdict = $failed ? 'failed' : ($warning ? 'warning' : 'ok');

        return $this->finish($report + [
            'verdict' => $verdict,
            'summary' => match ($verdict) {
                'ok' => sprintf('Sauvegarde du %s vérifiée : %d tables et %s lignes relues et restaurées à l’essai sans écart.', self::frenchDate((string) $manifest['createdAt']), count($tables), number_format($rows, 0, ',', ' ')),
                'warning' => sprintf('Sauvegarde du %s utilisable, avec %d point(s) à surveiller.', self::frenchDate((string) $manifest['createdAt']), max(1, count($issues))),
                default => sprintf('Échec : la sauvegarde du %s ne peut pas être restaurée telle quelle (%d problème(s)).', self::frenchDate((string) $manifest['createdAt']), count($issues)),
            },
            'totals' => ['tables' => count($tables), 'rows' => $rows, 'bytes' => $bytes],
            'tables' => $tables,
            'issues' => $issues,
            'restoreMode' => $restoreMode,
        ], $started);
    }

    /**
     * @param array<string, mixed> $entry
     * @return array{status: string, notes: list<string>}
     */
    private function checkTable(string $dir, string $name, array $entry, bool $existsNow, string &$restoreMode): array
    {
        $notes = [];
        $path = $dir.'/'.($entry['file'] ?? '');
        if (!is_file($path)) {
            return ['status' => 'failed', 'notes' => ['Fichier de sauvegarde manquant.']];
        }
        if (!hash_equals((string) ($entry['sha256'] ?? ''), (string) hash_file('sha256', $path))) {
            return ['status' => 'failed', 'notes' => ['Somme de contrôle différente : le fichier a été altéré ou tronqué.']];
        }
        $columns = array_values((array) ($entry['columns'] ?? []));
        $status = 'ok';
        if (!$existsNow) {
            $status = 'warning';
            $notes[] = 'La table n’existe plus dans la base actuelle : restauration d’essai impossible.';
        } else {
            $current = $this->runner->columns($name);
            $added = array_diff($current, $columns);
            $removed = array_diff($columns, $current);
            if ($added !== [] || $removed !== []) {
                $status = 'warning';
                $notes[] = sprintf('Schéma modifié depuis la sauvegarde (%s%s).', $added !== [] ? 'colonnes ajoutées : '.implode(', ', $added) : '', $removed !== [] ? ($added !== [] ? ' ; ' : '').'colonnes retirées : '.implode(', ', $removed) : '');
            }
        }

        $temporary = null;
        $restore = $existsNow && $status === 'ok' && $restoreMode === 'temporary_tables';
        if ($restore && (int) ($entry['rows'] ?? 0) > $this->restoreMaxRows) {
            $restore = false;
            $status = 'warning';
            $notes[] = sprintf('Plus de %d lignes : restauration d’essai non faite, relecture seulement.', $this->restoreMaxRows);
        }
        if ($restore) {
            $temporary = 'nt_restore_check_'.substr(hash('sha256', $name), 0, 12);
            try {
                $this->connection->executeStatement(sprintf('DROP TEMPORARY TABLE IF EXISTS %s', $temporary));
                $this->connection->executeStatement(sprintf('CREATE TEMPORARY TABLE %s LIKE %s', $temporary, $this->connection->quoteIdentifier($name)));
            } catch (\Throwable) {
                $restoreMode = 'reread_only';
                $temporary = null;
            }
        }

        $read = 0;
        $batch = [];
        $gz = gzopen($path, 'rb');
        if ($gz === false) {
            return ['status' => 'failed', 'notes' => ['Archive illisible.']];
        }
        try {
            while (($raw = gzgets($gz)) !== false) {
                if (trim($raw) === '') {
                    continue;
                }
                $row = json_decode($raw, true);
                if (!is_array($row) || array_keys($row) !== $columns) {
                    return ['status' => 'failed', 'notes' => [sprintf('Ligne %d illisible ou colonnes inattendues.', $read + 1)]];
                }
                ++$read;
                if ($temporary !== null) {
                    $batch[] = $row;
                    if (count($batch) >= self::INSERT_BATCH) {
                        $this->insertBatch($temporary, $columns, $batch);
                        $batch = [];
                    }
                }
            }
            if ($temporary !== null && $batch !== []) {
                $this->insertBatch($temporary, $columns, $batch);
            }
        } catch (\Throwable $exception) {
            return ['status' => 'failed', 'notes' => ['Restauration d’essai refusée par la base : '.mb_substr($exception->getMessage(), 0, 160)]];
        } finally {
            gzclose($gz);
            if ($temporary !== null) {
                $restored = (int) $this->connection->fetchOne(sprintf('SELECT COUNT(*) FROM %s', $temporary));
                $this->connection->executeStatement(sprintf('DROP TEMPORARY TABLE IF EXISTS %s', $temporary));
            }
        }

        if ($read !== (int) ($entry['rows'] ?? -1)) {
            return ['status' => 'failed', 'notes' => [sprintf('%d lignes relues au lieu de %d.', $read, (int) $entry['rows'])]];
        }
        if ($temporary !== null && isset($restored) && $restored !== $read) {
            return ['status' => 'failed', 'notes' => [sprintf('%d lignes restaurées au lieu de %d.', $restored, $read)]];
        }
        if ($temporary !== null) {
            $notes[] = sprintf('%d lignes relues et restaurées à l’essai.', $read);
        } elseif ($status === 'ok') {
            $notes[] = sprintf('%d lignes relues (sans restauration d’essai).', $read);
            if ($restoreMode === 'reread_only') {
                $status = 'warning';
            }
        }

        return ['status' => $status, 'notes' => $notes];
    }

    /**
     * @param list<string> $columns
     * @param list<array<string, mixed>> $rows
     */
    private function insertBatch(string $table, array $columns, array $rows): void
    {
        $quoted = implode(', ', array_map(fn (string $c): string => $this->connection->quoteIdentifier($c), $columns));
        $placeholders = '('.implode(', ', array_fill(0, count($columns), '?')).')';
        $values = [];
        foreach ($rows as $row) {
            foreach ($row as $value) {
                $values[] = is_array($value) && isset($value['__b64']) ? base64_decode((string) $value['__b64']) : $value;
            }
        }
        $this->connection->executeStatement(
            sprintf('INSERT INTO %s (%s) VALUES %s', $table, $quoted, implode(', ', array_fill(0, count($rows), $placeholders))),
            $values,
        );
    }

    /**
     * @param array<string, mixed> $report
     * @return array<string, mixed>
     */
    private function finish(array $report, float $started): array
    {
        $report['finishedAt'] = gmdate(DATE_ATOM);
        $report['durationMs'] = (int) round((microtime(true) - $started) * 1000);
        $this->storage->saveReport($report);

        return $report;
    }

    private static function frenchDate(string $iso): string
    {
        $date = new \DateTimeImmutable($iso);

        return $date->setTimezone(new \DateTimeZone('Indian/Reunion'))->format('d/m/Y à H:i');
    }
}
