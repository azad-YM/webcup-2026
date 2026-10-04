<?php

declare(strict_types=1);

namespace Assistance\Domain\Transport;

use Assistance\Domain\Language\TextFolding;

/**
 * F97 : trouve, par des règles simples, comment aller d'un lieu à un autre sur le réseau municipal quand des lignes
 * sont interrompues. Un lieu est un arrêt ou un quartier. Pour chaque ligne utile, un verdict :
 * `ok` (elle circule), `delayed` (perturbée, avec son message) ou `replaced` (interrompue : ses solutions de remplacement).
 *
 * Les lignes sont des tableaux `{id, code, name, stops, districts, status, statusMessage, returnAt, replacements}`.
 * Règles pures, sans dépendance au framework.
 */
final class TripPlanner
{
    public const MAX_OPTIONS = 4;

    /**
     * Lieux du réseau cités dans un texte libre, dans leur ordre d'apparition (arrêts d'abord, puis quartiers).
     *
     * @param list<array<string, mixed>> $lines
     * @return list<string>
     */
    public static function placesIn(string $text, array $lines): array
    {
        $folded = ' '.self::norm($text).' ';
        $found = [];
        foreach (self::places($lines) as $place) {
            $position = mb_strpos($folded, ' '.self::norm($place).' ');
            if ($position !== false) {
                $found[$place] = $position;
            }
        }
        asort($found);
        // Un arrêt qui contient un nom de quartier (« École du Nord ») passe avant le quartier seul (« Nord »).
        $places = array_keys($found);

        return array_values(array_filter($places, static function (string $place) use ($places): bool {
            foreach ($places as $other) {
                if ($other !== $place && mb_strlen($other) > mb_strlen($place) && str_contains(self::norm($other), self::norm($place))) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * @param list<array<string, mixed>> $lines
     * @return list<array<string, mixed>> options triées : directes d'abord, celles qui circulent avant les autres
     */
    public static function plan(?string $from, ?string $to, array $lines): array
    {
        $byId = [];
        foreach ($lines as $line) {
            $byId[(string) $line['id']] = $line;
        }
        $serving = static fn (?string $place): array => $place === null ? [] : array_values(array_filter($lines, static fn (array $line): bool => self::serves($line, $place)));
        $fromLines = $serving($from);
        $toLines = $serving($to);
        $options = [];
        if ($from !== null && $to !== null) {
            foreach ($fromLines as $line) {
                if (in_array($line, $toLines, true)) {
                    $options[] = self::option($line, $byId);
                }
            }
            if ($options === []) {
                foreach ($fromLines as $first) {
                    foreach ($toLines as $second) {
                        $common = array_values(array_intersect($first['stops'], $second['stops']));
                        if ($common !== [] && $first['id'] !== $second['id']) {
                            $options[] = self::option($first, $byId, $common[0], $second);
                        }
                    }
                }
            }
        } else {
            foreach ($fromLines !== [] ? $fromLines : $toLines as $line) {
                $options[] = self::option($line, $byId);
            }
        }
        if ($options === [] && $from === null && $to === null) {
            foreach ($lines as $line) {
                if ($line['status'] !== 'normal') {
                    $options[] = self::option($line, $byId);
                }
            }
        }
        $rank = ['ok' => 0, 'delayed' => 1, 'replaced' => 2];
        usort($options, static fn (array $a, array $b): int => [$a['transfer'] === null ? 0 : 1, $rank[$a['verdict']]] <=> [$b['transfer'] === null ? 0 : 1, $rank[$b['verdict']]]);

        return array_slice($options, 0, self::MAX_OPTIONS);
    }

    /** Résumé en langage clair, utilisé sans modèle de langage et comme base du modèle. @param list<array<string, mixed>> $options */
    public static function summary(?string $from, ?string $to, array $options): string
    {
        $trip = match (true) {
            $from !== null && $to !== null => sprintf('De %s à %s', $from, $to),
            $from !== null => sprintf('Depuis %s', $from),
            default => 'Sur le réseau',
        };
        if ($options === []) {
            return $from === null && $to === null
                ? 'Toutes les lignes circulent normalement. Indiquez votre point de départ et votre destination pour voir la ligne à prendre.'
                : sprintf('%s : aucune ligne municipale ne relie ces lieux. Le transport à la demande du service Mobilité peut vous aider.', $trip);
        }
        $best = $options[0];
        $first = match ($best['verdict']) {
            'ok' => sprintf('%s : prenez la ligne %s (%s), elle circule normalement', $trip, $best['code'], $best['name']),
            'delayed' => sprintf('%s : la ligne %s circule avec des perturbations (%s)', $trip, $best['code'], rtrim((string) $best['statusMessage'], '.')),
            default => sprintf('%s : la ligne %s est interrompue. Solution de remplacement : %s', $trip, $best['code'], $best['replacements'][0]['label'] ?? 'transport à la demande'),
        };
        if ($best['transfer'] !== null) {
            $first .= sprintf(', puis changez à %s pour la ligne %s', $best['transfer']['stop'], $best['transfer']['code']);
        }

        return $first.'.';
    }

    /**
     * @param array<string, mixed> $line
     * @param array<string, array<string, mixed>> $byId
     * @param array<string, mixed>|null $next
     * @return array<string, mixed>
     */
    private static function option(array $line, array $byId, ?string $transferStop = null, ?array $next = null): array
    {
        $verdict = match ($line['status']) {
            'interrupted' => 'replaced',
            'disrupted' => 'delayed',
            default => 'ok',
        };
        if ($next !== null && $verdict === 'ok' && $next['status'] !== 'normal') {
            $verdict = $next['status'] === 'interrupted' ? 'replaced' : 'delayed';
        }
        $replacements = array_map(static function (array $item) use ($byId): array {
            $target = $item['lineId'] !== null ? ($byId[$item['lineId']] ?? null) : null;

            return $item + ['lineStatus' => $target['status'] ?? null, 'lineCode' => $target['code'] ?? null];
        }, $line['status'] === 'interrupted' ? $line['replacements'] : ($next !== null && $next['status'] === 'interrupted' ? $next['replacements'] : []));

        return [
            'lineId' => $line['id'],
            'code' => $line['code'],
            'name' => $line['name'],
            'status' => $line['status'],
            'statusMessage' => $line['statusMessage'] !== '' ? $line['statusMessage'] : (string) ($next['statusMessage'] ?? ''),
            'returnAt' => $line['returnAt'],
            'verdict' => $verdict,
            'replacements' => $replacements,
            'transfer' => $next === null ? null : ['stop' => $transferStop, 'lineId' => $next['id'], 'code' => $next['code'], 'name' => $next['name'], 'status' => $next['status']],
        ];
    }

    /** @param array<string, mixed> $line */
    private static function serves(array $line, string $place): bool
    {
        $target = self::norm($place);
        foreach ([...$line['stops'], ...$line['districts']] as $candidate) {
            if (self::norm((string) $candidate) === $target) {
                return true;
            }
        }

        return false;
    }

    /** @param list<array<string, mixed>> $lines @return list<string> */
    private static function places(array $lines): array
    {
        $places = [];
        foreach ($lines as $line) {
            foreach ([...$line['stops'], ...$line['districts']] as $place) {
                $places[(string) $place] = true;
            }
        }

        return array_keys($places);
    }

    private static function norm(string $text): string
    {
        return trim((string) preg_replace('/[^\p{L}\p{N}]+/u', ' ', TextFolding::fold($text)));
    }
}
