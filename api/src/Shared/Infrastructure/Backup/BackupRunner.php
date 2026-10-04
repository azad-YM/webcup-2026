<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup;

use Doctrine\DBAL\Connection;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F87 (ADR 012) : export logique des tables importantes de chaque BC, compressé, horodaté, avec somme de contrôle.
 *
 * Outil d'exploitation au niveau de la base (comme `mysqldump`), sans règle métier : il ne lit que la liste de
 * tables déclarée dans `config/packages/platform.yaml` (`app.backup.tables`, groupée par BC) et ne connaît
 * aucune classe d'un BC. Lecture dans un instantané cohérent (`START TRANSACTION WITH CONSISTENT SNAPSHOT`,
 * InnoDB). Les champs chiffrés (ADR 007) restent chiffrés : la clé `DATA_ENCRYPTION_KEY` se sauvegarde à part.
 */
final readonly class BackupRunner
{
    /** @param array<string, list<string>> $tables BC → tables */
    public function __construct(
        private Connection $connection,
        private BackupStorage $storage,
        #[Autowire('%app.backup.tables%')] private array $tables,
    ) {}

    /** @return array<string, mixed> rapport de sauvegarde */
    public function run(): array
    {
        $started = microtime(true);
        $id = gmdate('Ymd\THis\Z');
        $dir = $this->storage->backupDir($id);
        $this->storage->ensureDir($dir);
        $existing = array_flip($this->connection->createSchemaManager()->listTableNames());
        $manifestTables = [];
        $issues = [];
        $rows = 0;
        $bytes = 0;

        $this->connection->executeStatement('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $this->connection->executeStatement('START TRANSACTION WITH CONSISTENT SNAPSHOT');
        try {
            foreach ($this->tables as $bc => $tables) {
                foreach ($tables as $table) {
                    if (!isset($existing[$table])) {
                        $manifestTables[$table] = ['bc' => $bc, 'missing' => true];
                        $issues[] = sprintf('La table « %s » (%s) n’existe pas dans la base : migrations à appliquer ?', $table, $bc);
                        continue;
                    }
                    $entry = $this->exportTable($dir, $table);
                    $manifestTables[$table] = ['bc' => $bc, 'missing' => false] + $entry;
                    $rows += $entry['rows'];
                    $bytes += $entry['bytes'];
                }
            }
        } finally {
            $this->connection->executeStatement('COMMIT');
        }

        $manifest = [
            'id' => $id,
            'createdAt' => gmdate(DATE_ATOM),
            'format' => 'ndjson.gz',
            'database' => $this->connection->getDatabase(),
            'tables' => $manifestTables,
        ];
        file_put_contents($dir.'/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        @chmod($dir.'/manifest.json', 0600);
        $removed = $this->storage->prune();

        $saved = count(array_filter($manifestTables, static fn (array $t): bool => !$t['missing']));
        $verdict = $issues === [] ? 'ok' : 'warning';
        $report = [
            'id' => $id,
            'type' => 'run',
            'backupId' => $id,
            'startedAt' => gmdate(DATE_ATOM, (int) $started),
            'finishedAt' => gmdate(DATE_ATOM),
            'durationMs' => (int) round((microtime(true) - $started) * 1000),
            'verdict' => $verdict,
            'summary' => sprintf(
                'Sauvegarde %s : %d tables, %s lignes, %s compressés.%s',
                $verdict === 'ok' ? 'réussie' : 'faite avec des points à surveiller',
                $saved,
                number_format($rows, 0, ',', ' '),
                self::humanBytes($bytes),
                $removed !== [] ? sprintf(' %d ancienne(s) sauvegarde(s) supprimée(s) (rétention : %d).', count($removed), $this->storage->retention()) : '',
            ),
            'totals' => ['tables' => $saved, 'rows' => $rows, 'bytes' => $bytes],
            'tables' => array_map(
                static fn (string $name, array $t): array => [
                    'name' => $name,
                    'bc' => $t['bc'],
                    'rows' => $t['rows'] ?? 0,
                    'bytes' => $t['bytes'] ?? 0,
                    'status' => $t['missing'] ? 'missing' : 'ok',
                    'notes' => $t['missing'] ? 'Table absente de la base.' : '',
                ],
                array_keys($manifestTables),
                $manifestTables,
            ),
            'issues' => $issues,
            'restoreMode' => null,
        ];
        $this->storage->saveReport($report);

        return $report;
    }

    /** @return array{file: string, rows: int, bytes: int, sha256: string, columns: list<string>} */
    private function exportTable(string $dir, string $table): array
    {
        $file = $table.'.ndjson.gz';
        $path = $dir.'/'.$file;
        $gz = gzopen($path, 'wb6');
        if ($gz === false) {
            throw new \RuntimeException(sprintf('Impossible d’écrire « %s ».', $path));
        }
        $rows = 0;
        try {
            $result = $this->connection->executeQuery(sprintf('SELECT * FROM %s', $this->connection->quoteIdentifier($table)));
            foreach ($result->iterateAssociative() as $row) {
                gzwrite($gz, json_encode(self::encodeRow($row), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n");
                ++$rows;
            }
        } finally {
            gzclose($gz);
        }
        @chmod($path, 0600);

        return [
            'file' => $file,
            'rows' => $rows,
            'bytes' => (int) filesize($path),
            'sha256' => (string) hash_file('sha256', $path),
            'columns' => $this->columns($table),
        ];
    }

    /** @return list<string> */
    public function columns(string $table): array
    {
        return array_values(array_map(
            static fn ($column): string => $column->getName(),
            $this->connection->createSchemaManager()->listTableColumns($table),
        ));
    }

    /**
     * Les valeurs binaires (non UTF-8) sont encodées en base64 sous `{"__b64": "…"}` pour rester restaurables.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function encodeRow(array $row): array
    {
        foreach ($row as $key => $value) {
            if (is_string($value) && !mb_check_encoding($value, 'UTF-8')) {
                $row[$key] = ['__b64' => base64_encode($value)];
            }
        }

        return $row;
    }

    public static function humanBytes(int $bytes): string
    {
        return match (true) {
            $bytes >= 1_048_576 => number_format($bytes / 1_048_576, 1, ',', ' ').' Mo',
            $bytes >= 1024 => number_format($bytes / 1024, 1, ',', ' ').' ko',
            default => $bytes.' octets',
        };
    }
}
