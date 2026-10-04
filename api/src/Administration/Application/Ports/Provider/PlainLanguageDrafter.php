<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Provider;

/**
 * F89 : propose un brouillon de version « En clair » d'une fiche de service, que l'agent relit puis valide en enregistrant.
 * Implémenté par Assistance (`Assistance/Infrastructure/Adapter/Administration/AssistancePlainLanguageDrafter`) :
 * modèle de langage quand il est disponible, brouillon local sinon. Rien n'est enregistré par ce port.
 */
interface PlainLanguageDrafter
{
    /** @param list<string> $texts résumé puis description, par ordre d'importance */
    public function draft(string $title, array $texts): PlainLanguageDraft;
}
