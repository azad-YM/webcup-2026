<?php

declare(strict_types=1);

namespace Assistance\Application\Query\Explain;

use Assistance\Application\Service\AssistantModel;
use Assistance\Domain\Language\PlainLexicon;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F90 : le modèle reformule le passage en langage clair, sans rien ajouter (`source: model`).
 * Repli local (`source: local`) : définitions simples des mots difficiles repérés ; le site y ajoute son glossaire
 * et la version « En clair » validée de la fiche (F89) quand elle existe.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ExplainPassageHandler
{
    public function __construct(private AssistantModel $model) {}

    /** @return array<string, mixed> */
    public function __invoke(ExplainPassageQuery $query): array
    {
        $language = AssistantModel::language($query->language);
        $text = trim($query->text);
        $terms = array_map(fn (array $entry) => ['term' => $entry['term'], 'definition' => $entry['definition']], PlainLexicon::find($text));
        $explanation = AssistantModel::clean($this->model->text(
            sprintf(
                'Tu réécris un passage d’un site municipal en langage clair, pour une personne qui lit difficilement le français administratif. '
                .'Écris en %s, avec des phrases courtes et des mots simples, en 4 phrases au plus. Garde exactement le sens : n’ajoute aucune information, '
                .'aucun chiffre, aucune date ni aucun conseil qui ne soit pas dans le passage. Réponds seulement par le texte réécrit.',
                AssistantModel::LANGUAGES[$language],
            ),
            $text,
            350,
        ), 1500);

        return [
            'explanation' => $explanation,
            'terms' => $terms,
            'source' => $explanation !== null ? 'model' : 'local',
            'modelAvailable' => $this->model->isAvailable(),
        ];
    }
}
