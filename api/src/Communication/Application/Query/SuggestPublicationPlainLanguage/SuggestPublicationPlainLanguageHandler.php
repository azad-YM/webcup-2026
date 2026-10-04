<?php

declare(strict_types=1);

namespace Communication\Application\Query\SuggestPublicationPlainLanguage;

use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Application\Ports\Provider\PlainLanguageDrafter;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Propose sans enregistrer : la version « En clair » n'est publiée que lorsque l'agent enregistre la publication. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class SuggestPublicationPlainLanguageHandler
{
    public function __construct(private PlainLanguageDrafter $drafter, private CommunicationAccessPolicy $access) {}

    /** @return array{text: string, source: string} */
    public function __invoke(SuggestPublicationPlainLanguageQuery $query): array
    {
        if (!$this->access->canPublish()) {
            throw new AccessDeniedException('Permission de publication requise.');
        }
        $body = array_values(array_filter($query->body, 'is_string'));
        $draft = $this->drafter->draft($query->title, [$query->summary, ...$body]);

        return ['text' => $draft['text'], 'source' => $draft['fromModel'] ? 'model' : 'local'];
    }
}
