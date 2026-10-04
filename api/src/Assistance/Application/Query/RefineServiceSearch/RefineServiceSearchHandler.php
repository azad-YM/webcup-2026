<?php

declare(strict_types=1);

namespace Assistance\Application\Query\RefineServiceSearch;

use Assistance\Application\Query\SearchServices\SearchServicesHandler;
use Assistance\Application\Service\AssistantModel;
use Assistance\Application\Service\ServiceFinder;
use Assistance\Application\Service\ServiceMatch;
use Assistance\Application\Service\ServiceSearch;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Le modèle reformule la demande et choisit au plus trois services **du catalogue fourni** ; les identifiants
 * inconnus sont écartés. Les services choisis passent en tête, suivis du classement local. Sans modèle
 * (pas de clé, panne, réponse illisible), la réponse est celle de la recherche locale (`source: local`).
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class RefineServiceSearchHandler
{
    public function __construct(private ServiceFinder $finder, private AssistantModel $model) {}

    /** @return array<string, mixed> */
    public function __invoke(RefineServiceSearchQuery $query): array
    {
        $language = AssistantModel::language($query->language);
        $text = trim($query->query);
        $local = $this->finder->find($text);
        $catalogue = $this->finder->catalogue();
        $answer = $catalogue === [] ? null : $this->model->json(
            sprintf(
                "Tu aides les habitants de la ville de Nova Terra à trouver le bon service municipal. Leur demande peut être mal écrite (fautes, mots du quotidien).\n"
                ."Catalogue (identifiant | nom | résumé) :\n%s\n\n"
                .'Réponds uniquement par un objet JSON : {"reformulation": "la demande reformulée en quelques mots simples, en %s", "services": ["identifiant", …]} '
                .'avec au plus 3 identifiants pris dans le catalogue, du plus pertinent au moins pertinent, ou une liste vide si aucun ne convient. N’invente aucun service.',
                AssistantModel::catalogueLines($catalogue),
                AssistantModel::LANGUAGES[$language],
            ),
            'Demande de l’habitant : '.$text,
            300,
        );
        if ($answer === null) {
            return SearchServicesHandler::view($text, $local, $language, null, 'local', $this->model->isAvailable());
        }

        $chosen = AssistantModel::knownIds($answer['services'] ?? null, $catalogue);
        $top = max($local->topScore(), 1.0);
        $matches = [];
        foreach ($chosen as $rank => $id) {
            $service = $this->finder->findById($id);
            if ($service !== null) {
                $matches[$id] = new ServiceMatch($service, round($top + 3 - $rank, 2));
            }
        }
        foreach ($local->matches as $match) {
            $matches[$match->service->id] ??= $match;
        }

        return SearchServicesHandler::view(
            $text,
            new ServiceSearch(array_slice(array_values($matches), 0, 8), $local->suggestion),
            $language,
            AssistantModel::clean($answer['reformulation'] ?? null, 200),
            'model',
            true,
        );
    }
}
