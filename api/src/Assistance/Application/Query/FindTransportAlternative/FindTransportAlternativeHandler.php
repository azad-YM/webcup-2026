<?php

declare(strict_types=1);

namespace Assistance\Application\Query\FindTransportAlternative;

use Assistance\Application\Ports\Provider\NetworkLine;
use Assistance\Application\Ports\Provider\TransportNetwork;
use Assistance\Application\Service\AssistantModel;
use Assistance\Domain\Language\EmergencyDetector;
use Assistance\Domain\Transport\TripPlanner;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F97 (IA) : trouver une solution de remplacement quand des lignes sont interrompues. Ordre des garde-fous :
 * 1. urgence vitale ou danger détecté par règles → 15 / 17 / 18 / 112, sans appel au modèle ;
 * 2. règles (`TripPlanner`) : lieux reconnus parmi les arrêts et quartiers du réseau, options calculées sur l'état
 *    réel des lignes — c'est toujours la source des options affichées ;
 * 3. modèle (si disponible) : il rédige seulement la réponse en langage clair à partir de ces options et du réseau
 *    fourni, sans rien inventer (`source: model`) ; sinon le résumé par règles (`source: local`).
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class FindTransportAlternativeHandler
{
    public function __construct(private TransportNetwork $network, private AssistantModel $model) {}

    /** @return array<string, mixed> */
    public function __invoke(FindTransportAlternativeQuery $query): array
    {
        $language = AssistantModel::language($query->language);
        $question = trim($query->question);
        $kind = $question === '' ? null : EmergencyDetector::detect($question);
        if ($kind !== null) {
            return [
                'emergency' => ['kind' => $kind, 'numbers' => EmergencyDetector::numbers($kind)],
                'answer' => sprintf('Urgence : appelez tout de suite le %s. Les secours se déplacent jusqu’à vous.', implode(' ou le ', EmergencyDetector::numbers($kind))),
                'from' => null, 'to' => null, 'options' => [], 'source' => 'local',
            ];
        }
        $lines = array_map(static fn (NetworkLine $line): array => $line->toArray(), $this->network->lines());
        $mentioned = $question === '' ? [] : TripPlanner::placesIn($question, $lines);
        $from = self::place($query->from, $lines) ?? ($mentioned[0] ?? null);
        $to = self::place($query->to, $lines) ?? (count($mentioned) > 1 ? $mentioned[1] : null);
        if ($from !== null && $to === null && $query->from === null && $query->to === null && preg_match('/\b(aller|vais|va|rendre|to)\b[^.]*$/u', mb_strtolower($question)) === 1 && count($mentioned) === 1) {
            // « Je vais à l'École du Nord » : le seul lieu cité est la destination.
            [$from, $to] = [null, $from];
        }
        $options = TripPlanner::plan($from, $to, $lines);
        $summary = TripPlanner::summary($from, $to, $options);
        $answer = $this->withModel($question, $from, $to, $options, $lines, $language);

        return [
            'emergency' => null,
            'answer' => $answer ?? $summary,
            'from' => $from,
            'to' => $to,
            'options' => $options,
            'source' => $answer !== null ? 'model' : 'local',
            'modelAvailable' => $this->model->isAvailable(),
        ];
    }

    /**
     * @param list<array<string, mixed>> $options
     * @param list<array<string, mixed>> $lines
     */
    private function withModel(string $question, ?string $from, ?string $to, array $options, array $lines, string $language): ?string
    {
        if (!$this->model->isAvailable() || ($question === '' && $from === null && $to === null)) {
            return null;
        }
        $network = implode("\n", array_map(static fn (array $line): string => sprintf(
            'Ligne %s (%s) : %s | état : %s%s%s',
            $line['code'],
            $line['name'],
            implode(' → ', $line['stops']),
            $line['status'],
            $line['statusMessage'] !== '' ? ' — '.$line['statusMessage'] : '',
            $line['replacements'] === [] ? '' : ' | remplacement : '.implode(' ; ', array_map(static fn (array $item): string => trim($item['label'].'. '.$item['details']), $line['replacements'])),
        ), $lines));
        $computed = json_encode(['depart' => $from, 'destination' => $to, 'options' => $options], JSON_UNESCAPED_UNICODE);
        $text = AssistantModel::clean($this->model->text(
            sprintf(
                'Tu aides un habitant de Nova Terra à se déplacer quand des lignes de transport sont interrompues. Écris en %s, '
                .'en 3 phrases courtes au plus, sans jargon : quelle ligne prendre ou quelle solution de remplacement utiliser, où la prendre, '
                .'et combien de temps la perturbation doit durer si c’est connu. Utilise UNIQUEMENT le réseau et les options calculées ci-dessous ; '
                .'n’invente aucun arrêt, horaire ni ligne. Si aucune option ne convient, conseille le transport à la demande du service Mobilité.'
                ."\n\nRéseau :\n%s\n\nOptions calculées : %s",
                AssistantModel::LANGUAGES[$language],
                $network,
                $computed,
            ),
            $question !== '' ? $question : sprintf('Aller de %s à %s.', $from ?? '?', $to ?? '?'),
            300,
        ), 800);

        return $text;
    }

    /** Lieu choisi dans la liste, gardé seulement s'il existe sur le réseau. @param list<array<string, mixed>> $lines */
    private static function place(?string $value, array $lines): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        $found = TripPlanner::placesIn($value, $lines);

        return $found[0] ?? null;
    }
}
