<?php

declare(strict_types=1);

namespace Assistance\Infrastructure\Adapter\Communication;

use Assistance\Application\Service\PlainLanguageWriter;
use Communication\Application\Ports\Provider\PlainLanguageDrafter;

/** F89 : Communication demande un brouillon « En clair » d'une publication à Assistance. */
final readonly class AssistancePublicationPlainLanguageDrafter implements PlainLanguageDrafter
{
    public function __construct(private PlainLanguageWriter $writer) {}

    public function draft(string $title, array $texts): array
    {
        return $this->writer->draft($title, $texts);
    }
}
