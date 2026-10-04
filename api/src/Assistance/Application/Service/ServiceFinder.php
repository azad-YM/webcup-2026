<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

use Assistance\Application\Ports\Provider\CatalogService;
use Assistance\Application\Ports\Provider\ServiceCatalog;
use Assistance\Domain\Language\EverydayVocabulary;
use Assistance\Domain\Language\TextFolding;

/**
 * Recherche tolérante dans le catalogue (D10), sans modèle : accents et majuscules ignorés, pluriels ramenés
 * au singulier, fautes de frappe corrigées vers un mot connu (« Vous vouliez dire… »), mots du quotidien
 * traduits en mots du catalogue, puis classement par pertinence (nom > mots-clés > résumé > thème).
 */
final class ServiceFinder
{
    /** Mots des thèmes du catalogue (identifiants contractuels d'Administration). */
    private const CATEGORY_WORDS = [
        'demarches' => 'papiers citoyenneté démarches',
        'cadre-de-vie' => 'cadre de vie ville quartier',
        'sante-solidarite' => 'santé solidarité soins',
        'mobilite' => 'mobilité transports déplacements',
        'habitat' => 'habitat logement',
        'famille' => 'famille éducation enfants',
    ];

    /** @var array{services: list<CatalogService>, index: array<string, array<string, float>>, vocabulary: array<string, string>}|null */
    private ?array $cache = null;

    public function __construct(private readonly ServiceCatalog $catalog) {}

    /** @return list<CatalogService> */
    public function catalogue(): array
    {
        return $this->indexed()['services'];
    }

    public function find(string $query, int $limit = 8): ServiceSearch
    {
        ['services' => $services, 'index' => $index, 'vocabulary' => $vocabulary] = $this->indexed();
        $words = array_slice(TextFolding::words($query), 0, 30);
        if ($words === []) {
            return new ServiceSearch([], null);
        }
        $known = $vocabulary + array_fill_keys(EverydayVocabulary::knownWords(), '');
        $corrections = [];
        $termsByWord = [];
        foreach ($words as $word) {
            $terms = [$word => 1.0];
            foreach (EverydayVocabulary::expand($word) as $synonym) {
                $terms[$synonym] = max($terms[$synonym] ?? 0, 0.8);
            }
            if (!isset($known[$word])) {
                $closest = $this->closest($word, array_keys($known));
                if ($closest !== null) {
                    $corrections[$word] = $closest;
                    $terms[$closest] = 0.9;
                    foreach (EverydayVocabulary::expand($closest) as $synonym) {
                        $terms[$synonym] = max($terms[$synonym] ?? 0, 0.75);
                    }
                }
            }
            $termsByWord[$word] = $terms;
        }

        $scored = [];
        foreach ($services as $service) {
            $tokens = $index[$service->id];
            $score = 0.0;
            $matchedWords = 0;
            foreach ($termsByWord as $terms) {
                $best = 0.0;
                foreach ($terms as $term => $termWeight) {
                    $best = max($best, $this->termScore((string) $term, $tokens) * $termWeight);
                }
                $score += $best;
                $matchedWords += $best > 0 ? 1 : 0;
            }
            if ($score > 0) {
                // Tous les mots trouvés : la fiche répond à toute la demande.
                $scored[] = new ServiceMatch($service, round($score * ($matchedWords === count($termsByWord) ? 1.25 : 1.0), 2));
            }
        }
        usort($scored, fn (ServiceMatch $a, ServiceMatch $b) => [$b->score, $a->service->name] <=> [$a->score, $b->service->name]);

        $suggestion = null;
        if ($corrections !== []) {
            $suggestion = implode(' ', array_map(
                fn (string $word) => isset($corrections[$word]) ? ($vocabulary[$corrections[$word]] ?? $corrections[$word]) : ($vocabulary[$word] ?? $word),
                $words,
            ));
            $suggestion = $suggestion === '' ? null : $suggestion;
        }

        return new ServiceSearch(array_slice($scored, 0, $limit), $suggestion);
    }

    public function findById(string $id): ?CatalogService
    {
        foreach ($this->catalogue() as $service) {
            if ($service->id === $id) {
                return $service;
            }
        }

        return null;
    }

    /** @param array<string, float> $tokens */
    private function termScore(string $term, array $tokens): float
    {
        if (isset($tokens[$term])) {
            return $tokens[$term];
        }
        $best = 0.0;
        if (mb_strlen($term) >= 4) {
            foreach ($tokens as $token => $weight) {
                // « transpor » trouve « transports », « enfant » trouve « enfance ».
                if (str_starts_with((string) $token, $term) || (mb_strlen((string) $token) >= 5 && str_starts_with($term, (string) $token))) {
                    $best = max($best, $weight * 0.6);
                }
            }
        }

        return $best;
    }

    /** @param list<string> $vocabulary */
    private function closest(string $word, array $vocabulary): ?string
    {
        $best = null;
        $bestDistance = PHP_INT_MAX;
        foreach ($vocabulary as $candidate) {
            $candidate = (string) $candidate;
            if (TextFolding::isCloseTo($word, $candidate)) {
                $distance = levenshtein($word, $candidate);
                if ($distance < $bestDistance) {
                    [$best, $bestDistance] = [$candidate, $distance];
                }
            }
        }

        return $best;
    }

    /** @return array{services: list<CatalogService>, index: array<string, array<string, float>>, vocabulary: array<string, string>} */
    private function indexed(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }
        $index = [];
        $vocabulary = [];
        $services = $this->catalog->services();
        foreach ($services as $service) {
            $fields = [
                [$service->name, 3.0],
                [implode(' ', $service->keywords), 2.5],
                [implode(' ', array_map(fn (array $texts) => $texts['name'], $service->translations)), 2.5],
                [$service->summary, 1.0],
                [implode(' ', array_map(fn (array $texts) => $texts['summary'], $service->translations)), 1.0],
                [self::CATEGORY_WORDS[$service->category] ?? '', 1.2],
                [$service->plainLanguage, 0.8],
            ];
            $tokens = [];
            foreach ($fields as [$text, $weight]) {
                foreach ($this->displayWords($text) as $token => $display) {
                    $tokens[$token] = max($tokens[$token] ?? 0, $weight);
                    $vocabulary[$token] ??= $display;
                }
            }
            $index[$service->id] = $tokens;
        }

        return $this->cache = ['services' => $services, 'index' => $index, 'vocabulary' => $vocabulary];
    }

    /** @return array<string, string> mot plié au singulier => forme lisible (avec accents) */
    private function displayWords(string $text): array
    {
        $words = [];
        foreach (preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $raw) {
            foreach (TextFolding::words($raw) as $word) {
                $words[$word] ??= $raw;
            }
        }

        return $words;
    }
}
