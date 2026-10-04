<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

/** F52 : un habitant soutient un signalement public déposé par un autre (un seul soutien par citoyen et par demande). */
class RequestSupport
{
    private function __construct(
        public readonly string $id,
        public readonly string $requestId,
        public readonly string $citizenId,
        public readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function give(string $id, ServiceRequest $request, string $citizenId, \DateTimeImmutable $at): self
    {
        if (!$request->canBeSupported()) {
            throw new \DomainException('Only an open public report can be supported.');
        }
        if ($request->citizenId === $citizenId) {
            throw new \DomainException('You cannot support your own request.');
        }

        return new self($id, $request->id, $citizenId, $at);
    }
}
