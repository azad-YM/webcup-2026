<?php

declare(strict_types=1);

namespace Assistance\Infrastructure\Adapter\Administration;

use Administration\Application\Ports\Provider\PlainLanguageDraft;
use Administration\Application\Ports\Provider\PlainLanguageDrafter;
use Assistance\Application\Service\PlainLanguageWriter;

/** F89 : Administration demande un brouillon « En clair » d'une fiche de service à Assistance. */
final readonly class AssistancePlainLanguageDrafter implements PlainLanguageDrafter
{
    public function __construct(private PlainLanguageWriter $writer) {}

    public function draft(string $title, array $texts): PlainLanguageDraft
    {
        $draft = $this->writer->draft($title, $texts);

        return new PlainLanguageDraft($draft['text'], $draft['fromModel']);
    }
}
