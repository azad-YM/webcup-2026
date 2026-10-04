<?php

declare(strict_types=1);

namespace Pilotage\Application\Support;

/**
 * F88 : mise en forme d'un export.
 * CSV : UTF-8 avec BOM (ouverture directe dans un tableur), séparateur `;`, en-têtes en français, fins de ligne CRLF,
 * cellules commençant par `=`, `+`, `-`, `@`, tabulation ou retour chariot préfixées d'une apostrophe (injection de formules).
 * JSON : `{ dataset, generatedAt, columns: [{key, label}], rows: [{<libellé>: valeur}] }`.
 */
final class ExportFile
{
    private const FORMULA_START = ['=', '+', '-', '@', "\t", "\r"];

    /**
     * @param array<string, string>                                     $columns clé => en-tête
     * @param list<array<string, string|int|float|bool|null>>           $rows
     */
    public static function csv(array $columns, array $rows): string
    {
        $lines = [self::csvLine(array_values($columns))];
        foreach ($rows as $row) {
            $lines[] = self::csvLine(array_map(static fn (string $key): string => self::text($row[$key] ?? null), array_keys($columns)));
        }

        return "\u{FEFF}".implode("\r\n", $lines)."\r\n";
    }

    /**
     * @param array<string, string>                           $columns
     * @param list<array<string, string|int|float|bool|null>> $rows
     */
    public static function json(string $dataset, string $generatedAt, array $columns, array $rows): string
    {
        $items = [];
        foreach ($rows as $row) {
            $item = [];
            foreach ($columns as $key => $label) {
                $item[$label] = $row[$key] ?? null;
            }
            $items[] = $item;
        }
        $header = [];
        foreach ($columns as $key => $label) {
            $header[] = ['key' => $key, 'label' => $label];
        }

        return json_encode(
            ['dataset' => $dataset, 'generatedAt' => $generatedAt, 'columns' => $header, 'rows' => $items],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
        );
    }

    public static function text(string|int|float|bool|null $value): string
    {
        return match (true) {
            $value === null => '',
            is_bool($value) => $value ? 'Oui' : 'Non',
            default => (string) $value,
        };
    }

    /** @param list<string> $cells */
    private static function csvLine(array $cells): string
    {
        return implode(';', array_map(static function (string $cell): string {
            if ($cell !== '' && in_array($cell[0], self::FORMULA_START, true) && !is_numeric($cell)) {
                $cell = "'".$cell;
            }

            return '"'.str_replace('"', '""', $cell).'"';
        }, $cells));
    }
}
