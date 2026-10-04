<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\RequestMessage;

/** F84 : message d'une demande ; l'agent n'est jamais nommé (« La mairie »). */
final readonly class RequestMessageView
{
    public function __construct(
        public string $id,
        public string $author,
        public string $body,
        public string $createdAt,
    ) {}

    public static function from(RequestMessage $message): self
    {
        return new self($message->id, $message->author, $message->body, $message->createdAt->format(\DateTimeInterface::ATOM));
    }
}
