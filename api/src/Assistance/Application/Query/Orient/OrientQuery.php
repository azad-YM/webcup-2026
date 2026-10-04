<?php

declare(strict_types=1);

namespace Assistance\Application\Query\Orient;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * F91, F92 : l'habitant décrit son besoin, l'assistant l'oriente. Conversation courte envoyée en entier à chaque tour
 * (rien n'est stocké côté serveur) : au plus 8 messages `{role: user|assistant, text}`.
 */
final readonly class OrientQuery
{
    /** @param list<array{role?: string, text?: string}> $messages */
    public function __construct(
        #[Assert\Count(min: 1, max: 8)] public array $messages,
        #[Assert\Choice(['fr', 'en', 'ar'])] public string $language = 'fr',
    ) {}
}
