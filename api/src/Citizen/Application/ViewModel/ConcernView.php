<?php

declare(strict_types=1);

namespace Citizen\Application\ViewModel;

use Citizen\Domain\Entity\Concern;

final readonly class ConcernView
{
    /** @param list<array{status: string, at: string, comment: ?string}> $trail */
    public function __construct(
        public string $id,
        public string $reference,
        public string $topic,
        public string $subject,
        public string $message,
        public string $status,
        public ?string $response,
        public array $trail,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function from(Concern $concern): self
    {
        return new self(
            $concern->id,
            $concern->reference,
            $concern->topic,
            $concern->subject,
            $concern->message,
            $concern->status(),
            $concern->response(),
            $concern->trail(),
            $concern->createdAt->format(\DateTimeInterface::ATOM),
            $concern->updatedAt()->format(\DateTimeInterface::ATOM),
        );
    }
}
