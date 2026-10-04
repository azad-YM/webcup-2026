<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

use Assistance\Domain\Language\PlainLexicon;

/**
 * F89 : brouillon d'une version « En clair » (texte court) proposé à l'agent, qui relit et valide en enregistrant.
 * Modèle si disponible ; sinon brouillon local : premières phrases du résumé, mots difficiles remplacés.
 * Utilisé par les adaptateurs fournis à Administration (services) et Communication (publications).
 */
final readonly class PlainLanguageWriter
{
    public const MAX_LENGTH = 600;

    public function __construct(private AssistantModel $model) {}

    /**
     * @param list<string> $texts résumé puis contenu (ordre d'importance)
     *
     * @return array{text: string, fromModel: bool}
     */
    public function draft(string $title, array $texts): array
    {
        $source = mb_substr(trim(implode("\n\n", array_filter(array_map('trim', $texts)))), 0, 6000);
        $answer = AssistantModel::clean($this->model->text(
            'Tu rédiges la version « En clair » d’une page d’un site municipal : l’essentiel en langage clair, pour tous les habitants. '
            .'Écris en français, 2 à 4 phrases courtes, mots simples, sans jargon ni sigle, en vouvoyant. Dis à qui cela s’adresse, ce que l’on peut faire et comment. '
            .'Garde exactement le sens : n’ajoute aucune information, aucun chiffre, aucune date, aucun horaire qui ne soit pas dans le texte. '
            .sprintf('Au plus %d caractères. Réponds seulement par le texte.', self::MAX_LENGTH - 50),
            sprintf("Titre : %s\n\nTexte :\n%s", $title, $source),
            300,
        ), self::MAX_LENGTH);
        if ($answer !== null) {
            return ['text' => $answer, 'fromModel' => true];
        }

        return ['text' => self::localDraft($source), 'fromModel' => false];
    }

    private static function localDraft(string $source): string
    {
        $sentences = preg_split('/(?<=[.!?])\s+/u', (string) preg_replace('/\s+/u', ' ', $source), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $draft = '';
        foreach ($sentences as $sentence) {
            $sentence = PlainLexicon::simplify(trim($sentence));
            if ($draft !== '' && mb_strlen($draft.' '.$sentence) > 350) {
                break;
            }
            $draft = trim($draft.' '.$sentence);
            if (count(preg_split('/(?<=[.!?])\s+/u', $draft) ?: []) >= 3) {
                break;
            }
        }

        return mb_substr($draft, 0, self::MAX_LENGTH);
    }
}
