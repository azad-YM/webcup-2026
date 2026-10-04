<?php

declare(strict_types=1);

namespace Participation\Domain\Entity;

use Participation\Domain\Text;

/**
 * Answer of one citizen to one consultation (F65, F66). One per citizen and consultation, modifiable while the
 * consultation is open. Its reference and dates are the acknowledgement shown to the citizen.
 * The answer itself is checked by `Consultation::acceptAnswer()`.
 */
final class Contribution
{
    public const RATINGS = ['positive', 'mixed', 'negative'];
    public const COMMENT_MAX = 3000;

    private ?string $choice;
    private ?string $rating;
    private ?string $comment;
    private \DateTimeImmutable $updatedAt;
    private int $revisions = 0;

    private function __construct(
        public readonly string $id,
        public readonly string $reference,
        public readonly string $consultationId,
        public readonly string $citizenId,
        public readonly \DateTimeImmutable $submittedAt,
    ) {
        $this->updatedAt = $submittedAt;
    }

    /** @param array{choice: ?string, rating: ?string, comment: ?string} $answer */
    public static function submit(string $id, string $consultationId, string $citizenId, array $answer, \DateTimeImmutable $now): self
    {
        $contribution = new self($id, Text::reference('CTR', $id), $consultationId, $citizenId, $now);
        $contribution->choice = $answer['choice'];
        $contribution->rating = $answer['rating'];
        $contribution->comment = $answer['comment'];

        return $contribution;
    }

    /** @param array{choice: ?string, rating: ?string, comment: ?string} $answer */
    public function change(array $answer, \DateTimeImmutable $now): void
    {
        $this->choice = $answer['choice'];
        $this->rating = $answer['rating'];
        $this->comment = $answer['comment'];
        $this->updatedAt = $now;
        ++$this->revisions;
    }

    public function choice(): ?string { return $this->choice; }

    public function rating(): ?string { return $this->rating; }

    public function comment(): ?string { return $this->comment; }

    /** Acknowledgement and current answer, for the citizen who wrote it. */
    public function receipt(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'consultationId' => $this->consultationId,
            'choice' => $this->choice,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'submittedAt' => $this->submittedAt->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
            'revised' => $this->revisions > 0,
        ];
    }

    /** What the agents read: the answer without the identity of the citizen. */
    public function anonymousView(): array
    {
        return [
            'reference' => $this->reference,
            'choice' => $this->choice,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'submittedAt' => $this->submittedAt->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }
}
