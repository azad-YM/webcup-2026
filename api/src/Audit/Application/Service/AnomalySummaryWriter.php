<?php

declare(strict_types=1);

namespace Audit\Application\Service;

use Audit\Domain\Entity\Anomaly;
use Shared\Application\Ports\Service\LanguageModel;

/**
 * F85 (IA) : résumé lisible des anomalies du jour pour un agent.
 *
 * Le modèle de langage reçoit seulement les règles, gravités, statuts et nombres d'occurrences — jamais
 * d'e-mail, d'adresse ni de nom. Sans clé ou en cas de panne, un **résumé par règles** est rédigé localement ;
 * la réponse indique honnêtement sa source (`ai` ou `rules`).
 */
final readonly class AnomalySummaryWriter
{
    public function __construct(private ?LanguageModel $model = null) {}

    /**
     * @param list<Anomaly> $anomalies
     * @return array{text: string, source: string}
     */
    public function write(array $anomalies): array
    {
        $rules = $this->byRule($anomalies);
        $local = $this->rulesSummary($anomalies, $rules);
        if ($anomalies === [] || $this->model === null || !$this->model->isAvailable()) {
            return ['text' => $local, 'source' => 'rules'];
        }
        $lines = [];
        foreach ($rules as $rule => $data) {
            $lines[] = sprintf('- %s : %d cas (%d graves, %d non traités, %d occurrences)', UnusualActivityDetector::RULES[$rule] ?? $rule, $data['count'], $data['critical'], $data['open'], $data['occurrences']);
        }
        $text = $this->model->complete(
            'Tu aides les agents d’une mairie à surveiller la sécurité de leur plateforme. Rédige en français simple, en 3 à 5 phrases, sans jargon ni liste à puces : ce qui s’est passé aujourd’hui, ce qui est le plus urgent, et quoi vérifier en premier. N’invente aucun fait.',
            "Anomalies détectées ces dernières 24 heures :\n".implode("\n", $lines),
            350,
        );
        $text = $text !== null ? trim($text) : '';

        return $text !== '' ? ['text' => mb_substr($text, 0, 1500), 'source' => 'ai'] : ['text' => $local, 'source' => 'rules'];
    }

    /**
     * @param list<Anomaly> $anomalies
     * @return array<string, array{count: int, critical: int, open: int, occurrences: int}>
     */
    private function byRule(array $anomalies): array
    {
        $rules = [];
        foreach ($anomalies as $anomaly) {
            $data = $rules[$anomaly->rule] ?? ['count' => 0, 'critical' => 0, 'open' => 0, 'occurrences' => 0];
            ++$data['count'];
            $data['critical'] += $anomaly->severity() === Anomaly::CRITICAL ? 1 : 0;
            $data['open'] += $anomaly->status() !== Anomaly::HANDLED ? 1 : 0;
            $data['occurrences'] += $anomaly->occurrences();
            $rules[$anomaly->rule] = $data;
        }
        uasort($rules, static fn (array $a, array $b): int => [$b['critical'], $b['count']] <=> [$a['critical'], $a['count']]);

        return $rules;
    }

    /**
     * @param list<Anomaly> $anomalies
     * @param array<string, array{count: int, critical: int, open: int, occurrences: int}> $rules
     */
    private function rulesSummary(array $anomalies, array $rules): string
    {
        if ($anomalies === []) {
            return 'Aucune activité inhabituelle ni incohérence détectée ces dernières 24 heures.';
        }
        $critical = count(array_filter($anomalies, static fn (Anomaly $a): bool => $a->severity() === Anomaly::CRITICAL && $a->status() !== Anomaly::HANDLED));
        $open = count(array_filter($anomalies, static fn (Anomaly $a): bool => $a->status() !== Anomaly::HANDLED));
        $top = array_slice(array_keys($rules), 0, 3);
        $text = sprintf(
            '%d anomalie(s) détectée(s) ces dernières 24 heures, dont %d encore à traiter. ',
            count($anomalies),
            $open,
        );
        $text .= $critical > 0
            ? sprintf('%d sont graves : commencez par elles. ', $critical)
            : 'Aucune n’est grave. ';
        $text .= 'Les plus fréquentes : '.implode(', ', array_map(static fn (string $rule): string => mb_strtolower(UnusualActivityDetector::RULES[$rule] ?? $rule).' ('.$rules[$rule]['count'].')', $top)).'.';

        return $text;
    }
}
