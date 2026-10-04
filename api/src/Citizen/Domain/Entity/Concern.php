<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\ConcernUpdated;
use Shared\Domain\Model\AggregateRoot;

/**
 * Inquiétude remontée par un habitant (F51) : usage de ses données, service, sécurité… Elle reçoit un accusé de
 * réception immédiat, puis une trace de prise en compte et la réponse d'un agent, visibles par le citoyen.
 */
class Concern
{
    use AggregateRoot;

    public const TOPICS = ['data', 'service', 'security', 'other'];

    public const RECEIVED = 'received';
    public const IN_REVIEW = 'in_review';
    public const ANSWERED = 'answered';
    public const STATUSES = [self::RECEIVED, self::IN_REVIEW, self::ANSWERED];

    public const SUBJECT_MAX = 160;
    public const MESSAGE_MAX = 5000;
    public const RESPONSE_MAX = 5000;

    private string $status = self::RECEIVED;
    private ?string $response = null;
    /** @var list<array{status: string, at: string, comment: ?string}> */
    private array $trail = [];
    private \DateTimeImmutable $updatedAt;

    private function __construct(
        public readonly string $id,
        public readonly string $reference,
        public readonly string $citizenId,
        public readonly string $topic,
        public readonly string $subject,
        public readonly string $message,
        public readonly \DateTimeImmutable $createdAt,
    ) {
        $this->updatedAt = $createdAt;
    }

    public static function raise(string $id, string $citizenId, string $topic, string $subject, string $message, \DateTimeImmutable $at): self
    {
        $subject = trim($subject);
        $message = trim($message);
        if (!in_array($topic, self::TOPICS, true)) {
            throw new \DomainException('Unknown concern topic.');
        }
        if ($subject === '' || mb_strlen($subject) > self::SUBJECT_MAX || $message === '' || mb_strlen($message) > self::MESSAGE_MAX) {
            throw new \DomainException('A subject (at most 160 characters) and a message (at most 5000) are required.');
        }
        // The tail of a UUID v7 is random; its head is a timestamp shared by concerns sent in the same instant.
        $reference = 'INQ-' . strtoupper(substr(str_replace('-', '', $id), -8));
        $concern = new self($id, $reference, $citizenId, $topic, $subject, $message, $at);
        $concern->trail[] = ['status' => self::RECEIVED, 'at' => $at->format(\DateTimeInterface::ATOM), 'comment' => null];

        return $concern;
    }

    /** Un agent marque la prise en compte (`in_review`) ou répond (`answered`, réponse obligatoire). */
    public function handle(string $status, ?string $comment, \DateTimeImmutable $at): void
    {
        $comment = trim($comment ?? '');
        $comment = $comment === '' ? null : $comment;
        if (!in_array($status, [self::IN_REVIEW, self::ANSWERED], true)) {
            throw new \DomainException('Unknown concern status.');
        }
        if (mb_strlen($comment ?? '') > self::RESPONSE_MAX) {
            throw new \DomainException('The response must not exceed 5000 characters.');
        }
        if ($status === self::ANSWERED && $comment === null) {
            throw new \DomainException('An answer is required.');
        }
        $this->status = $status;
        if ($status === self::ANSWERED) {
            $this->response = $comment;
        }
        $this->updatedAt = $at;
        $this->trail[] = ['status' => $status, 'at' => $at->format(\DateTimeInterface::ATOM), 'comment' => $comment];
        $this->record(new ConcernUpdated($this->id, $this->citizenId, $this->reference, $status));
    }

    public function status(): string { return $this->status; }
    public function response(): ?string { return $this->response; }
    public function updatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    /** @return list<array{status: string, at: string, comment: ?string}> */
    public function trail(): array { return $this->trail; }
}
