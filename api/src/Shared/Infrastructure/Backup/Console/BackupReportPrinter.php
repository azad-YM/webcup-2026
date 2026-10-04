<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup\Console;

use Shared\Infrastructure\Backup\BackupRunner;
use Symfony\Component\Console\Style\SymfonyStyle;

/** Affichage console d'un rapport de sauvegarde ou de vérification. */
final class BackupReportPrinter
{
    public const VERDICTS = ['ok' => 'OK', 'warning' => 'À surveiller', 'failed' => 'Échec'];

    /** @param array<string, mixed> $report */
    public static function print(SymfonyStyle $io, array $report): void
    {
        $io->section(($report['type'] === 'run' ? 'Sauvegarde ' : 'Vérification ').$report['id']);
        $io->table(
            ['Table', 'BC', 'Lignes', 'Taille', 'État', 'Notes'],
            array_map(static fn (array $t): array => [$t['name'], $t['bc'], $t['rows'], BackupRunner::humanBytes((int) $t['bytes']), $t['status'], $t['notes']], $report['tables']),
        );
        foreach ($report['issues'] as $issue) {
            $io->warning($issue);
        }
        $message = sprintf('%s — %s', self::VERDICTS[$report['verdict']] ?? $report['verdict'], $report['summary']);
        match ($report['verdict']) {
            'ok' => $io->success($message),
            'warning' => $io->warning($message),
            default => $io->error($message),
        };
    }
}
