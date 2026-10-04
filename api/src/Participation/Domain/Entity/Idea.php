<?php

declare(strict_types=1);

namespace Participation\Domain\Entity;

use Participation\Domain\Text;
use Shared\Domain\Exception\DomainException;

/**
 * Idea proposed by a citizen to improve the colony (F68). It is acknowledged at once (reference, date),
 * then followed by the agents: received → in_review → accepted | rejected (reason required) → done.
 * Ideas are public by default; an agent may keep an inappropriate idea off the public list, with a reason.
 */
final class Idea
{
    public const RECEIVED = 'received';
    public const IN_REVIEW = 'in_review';
    public const ACCEPTED = 'accepted';
    public const REJECTED = 'rejected';
    public const DONE = 'done';
    public const STATUSES = [self::RECEIVED, self::IN_REVIEW, self::ACCEPTED, self::REJECTED, self::DONE];

    public const TITLE_MAX = 160;
    public const DESCRIPTION_MAX = 5000;
    public const COMMENT_MAX = 2000;

    private string $status = self::RECEIVED;
    private ?string $statusComment = null;
    private bool $public = true;
    private ?string $hiddenReason = null;
    /** @var list<array{status: string, at: string, comment: ?string}> */
    private array $trail = [];
    private \DateTimeImmutable $updatedAt;

    private function __construct(
        public readonly string $id,
        public readonly string $reference,
        public readonly string $citizenId,
        public readonly string $title,
        public readonly string $description,
        public readonly ?string $district,
        public readonly \DateTimeImmutable $createdAt,
    ) {
        $this->updatedAt = $createdAt;
    }

    public static function propose(string $id, string $citizenId, string $title, string $description, ?string $district, \DateTimeImmutable $now): self
    {
        $idea = new self(
            $id,
            Text::reference('IDE', $id),
            $citizenId,
            Text::required($title, self::TITLE_MAX, 'Titre'),
            Text::required($description, self::DESCRIPTION_MAX, 'Description'),
            Text::optional($district, 40, 'Quartier'),
            $now,
        );
        $idea->trail[] = ['status' => self::RECEIVED, 'at' => $now->format(DATE_ATOM), 'comment' => null];

        return $idea;
    }

    /** An agent moves the idea forward; a rejection must say why. */
    public function follow(string $status, ?string $comment, \DateTimeImmutable $now): void
    {
        if (!in_array($status, self::STATUSES, true) || $status === self::RECEIVED) {
            throw new DomainException('Statut inconnu (in_review, accepted, rejected, done).');
        }
        if ($status === $this->status) {
            throw new DomainException('L’idée est déjà à ce statut.');
        }
        $comment = Text::optional($comment, self::COMMENT_MAX, 'Commentaire');
        if ($status === self::REJECTED && $comment === null) {
            throw new DomainException('Expliquez pourquoi l’idée n’est pas retenue.');
        }
        $this->status = $status;
        $this->statusComment = $comment;
        $this->updatedAt = $now;
        $this->trail[] = ['status' => $status, 'at' => $now->format(DATE_ATOM), 'comment' => $comment];
    }

    /** Keeps the idea off (with a reason) or back on the public list; the author keeps seeing it. */
    public function setPublic(bool $public, ?string $reason, \DateTimeImmutable $now): void
    {
        $reason = Text::optional($reason, self::COMMENT_MAX, 'Motif');
        if (!$public && $reason === null) {
            throw new DomainException('Indiquez le motif pour ne pas publier cette idée.');
        }
        if ($public === $this->public) {
            throw new DomainException($public ? 'L’idée est déjà publique.' : 'L’idée n’est déjà pas publiée.');
        }
        $this->public = $public;
        $this->hiddenReason = $public ? null : $reason;
        $this->updatedAt = $now;
    }

    public function status(): string { return $this->status; }

    public function isPublic(): bool { return $this->public; }

    public function hiddenReason(): ?string { return $this->hiddenReason; }

    /** Public view: no author. */
    public function publicView(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'title' => $this->title,
            'description' => $this->description,
            'district' => $this->district,
            'status' => $this->status,
            'statusComment' => $this->statusComment,
            'createdAt' => $this->createdAt->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }

    /** For the author (acknowledgement and follow-up) and for the agents (without the identity). */
    public function followUpView(): array
    {
        return $this->publicView() + [
            'public' => $this->public,
            'hiddenReason' => $this->hiddenReason,
            'trail' => $this->trail,
        ];
    }
}
