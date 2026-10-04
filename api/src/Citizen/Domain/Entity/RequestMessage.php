<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\RequestMessagePosted;
use Shared\Domain\Model\AggregateRoot;

/**
 * F84 : message échangé entre un agent et l'habitant sur une demande, visible des deux côtés.
 * Distinct des commentaires d'étape (`steps`) : c'est une conversation, pas un changement d'état.
 * Aucune identité d'agent n'est montrée à l'habitant (« La mairie »).
 */
class RequestMessage
{
    use AggregateRoot;

    public const AUTHOR_AGENT = 'agent';
    public const AUTHOR_CITIZEN = 'citizen';
    public const BODY_MAX = 3000;

    private function __construct(
        public readonly string $id,
        public readonly string $requestId,
        public readonly string $citizenId,
        public readonly string $author,
        public readonly ?string $authorUserId,
        public readonly string $body,
        public readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function post(string $id, ServiceRequest $request, string $author, ?string $authorUserId, string $body, \DateTimeImmutable $at): self
    {
        $body = trim($body);
        if (!in_array($author, [self::AUTHOR_AGENT, self::AUTHOR_CITIZEN], true)) {
            throw new \DomainException('Unknown author.');
        }
        if ($body === '' || mb_strlen($body) > self::BODY_MAX) {
            throw new \DomainException('A message of at most 3000 characters is required.');
        }
        if ($author === self::AUTHOR_CITIZEN && $request->isClosed()) {
            throw new \DomainException('This request is closed: send a new request instead.');
        }
        $message = new self($id, $request->id, $request->citizenId, $author, $authorUserId, $body, $at);
        $message->record(new RequestMessagePosted($id, $request->id, $request->citizenId, $request->reference, $author));

        return $message;
    }
}
