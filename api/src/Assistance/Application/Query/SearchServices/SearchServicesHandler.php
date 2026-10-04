<?php

declare(strict_types=1);

namespace Assistance\Application\Query\SearchServices;

use Assistance\Application\Service\AssistantModel;
use Assistance\Application\Service\ServiceFinder;
use Assistance\Application\Service\ServiceSearch;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class SearchServicesHandler
{
    public function __construct(private ServiceFinder $finder, private AssistantModel $model) {}

    /** @return array<string, mixed> */
    public function __invoke(SearchServicesQuery $query): array
    {
        $text = mb_substr(trim($query->query), 0, 300);

        return self::view($text, $this->finder->find($text), AssistantModel::language($query->language), null, 'local', $this->model->isAvailable());
    }

    /**
     * Contrat de réponse commun à la recherche locale et à la recherche reformulée.
     *
     * @return array<string, mixed>
     */
    public static function view(string $query, ServiceSearch $search, string $language, ?string $reformulation, string $source, bool $modelAvailable): array
    {
        $results = [];
        foreach ($search->matches as $match) {
            $results[] = [
                'id' => $match->service->id,
                'name' => $match->service->nameIn($language),
                'score' => $match->score,
                'status' => $match->service->status,
                'disabled' => $match->service->disabled,
                'emergency' => $match->service->emergency,
            ];
        }

        return [
            'query' => $query,
            'results' => $results,
            'suggestion' => $search->suggestion,
            'reformulation' => $reformulation,
            'source' => $source,
            'modelAvailable' => $modelAvailable,
        ];
    }
}
