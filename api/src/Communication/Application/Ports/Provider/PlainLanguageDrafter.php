<?php

declare(strict_types=1);

namespace Communication\Application\Ports\Provider;

/**
 * F89 : propose un brouillon de version « En clair » d'une publication, que l'agent relit puis valide en enregistrant.
 * Implémenté par Assistance (`Assistance/Infrastructure/Adapter/Communication/AssistancePublicationPlainLanguageDrafter`).
 */
interface PlainLanguageDrafter
{
    /**
     * @param list<string> $texts résumé puis paragraphes
     *
     * @return array{text: string, fromModel: bool}
     */
    public function draft(string $title, array $texts): array;
}
