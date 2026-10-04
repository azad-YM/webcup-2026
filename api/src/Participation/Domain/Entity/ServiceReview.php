<?php

declare(strict_types=1);

namespace Participation\Domain\Entity;

use Participation\Domain\Text;
use Shared\Domain\Exception\DomainException;

/**
 * F76 (L26) : avis d'un habitant après avoir utilisé un service municipal — note de 1 à 5, « avez-vous obtenu ce dont
 * vous aviez besoin ? », commentaire facultatif. Un avis par habitant, par service et par mois (`period`), modifiable.
 * Suivi par les agents : received → read (« Lu par le service ») → answered (« Réponse du service »).
 */
final class ServiceReview
{
    public const RECEIVED = 'received';
    public const READ = 'read';
    public const ANSWERED = 'answered';
    public const STATUSES = [self::RECEIVED, self::READ, self::ANSWERED];

    public const NEED_MET = ['yes', 'partly', 'no'];
    public const CONTEXTS = ['service', 'request', 'appointment'];
    public const COMMENT_MAX = 2000;
    public const RESPONSE_MAX = 2000;

    private int $rating;
    private string $needMet;
    private ?string $comment;
    private string $status = self::RECEIVED;
    private ?string $response = null;
    private ?\DateTimeImmutable $respondedAt = null;
    private \DateTimeImmutable $updatedAt;

    private function __construct(
        public readonly string $id,
        public readonly string $reference,
        public readonly string $citizenId,
        public readonly string $serviceId,
        private string $serviceName,
        public readonly string $period,
        private string $context,
        private ?string $contextReference,
        public readonly \DateTimeImmutable $createdAt,
    ) {
        $this->updatedAt = $createdAt;
    }

    public static function give(string $id, string $citizenId, string $serviceId, string $serviceName, int $rating, string $needMet, ?string $comment, string $context, ?string $contextReference, \DateTimeImmutable $now): self
    {
        $review = new self($id, Text::reference('AVI', $id), $citizenId, $serviceId, $serviceName, self::periodOf($now), 'service', null, $now);
        $review->revise($serviceName, $rating, $needMet, $comment, $context, $contextReference, $now);

        return $review;
    }

    /** The author changes the review of this period; it goes back to the agents' queue (the previous answer stays visible). */
    public function revise(string $serviceName, int $rating, string $needMet, ?string $comment, string $context, ?string $contextReference, \DateTimeImmutable $now): void
    {
        if ($rating < 1 || $rating > 5) {
            throw new DomainException('Choisissez une note de 1 à 5.');
        }
        if (!in_array($needMet, self::NEED_MET, true)) {
            throw new DomainException('Dites si vous avez obtenu ce dont vous aviez besoin (oui, en partie, non).');
        }
        if (!in_array($context, self::CONTEXTS, true)) {
            throw new DomainException('Contexte d’avis inconnu.');
        }
        $this->comment = Text::optional($comment, self::COMMENT_MAX, 'Commentaire');
        $this->contextReference = Text::optional($contextReference, 40, 'Référence');
        $this->serviceName = $serviceName;
        $this->rating = $rating;
        $this->needMet = $needMet;
        $this->context = $context;
        $this->status = self::RECEIVED;
        $this->updatedAt = $now;
    }

    public function markRead(\DateTimeImmutable $now): void
    {
        if ($this->status !== self::RECEIVED) {
            throw new DomainException('Cet avis a déjà été lu.');
        }
        $this->status = self::READ;
        $this->updatedAt = $now;
    }

    public function respond(string $response, \DateTimeImmutable $now): void
    {
        $this->response = Text::required($response, self::RESPONSE_MAX, 'Réponse');
        $this->respondedAt = $now;
        $this->status = self::ANSWERED;
        $this->updatedAt = $now;
    }

    public static function periodOf(\DateTimeImmutable $now): string
    {
        return $now->format('Y-m');
    }

    public function status(): string { return $this->status; }

    public function rating(): int { return $this->rating; }

    public function serviceName(): string { return $this->serviceName; }

    /** For the author (receipt, « Mes contributions ») and for the agents: never the identity of the citizen. */
    public function followUpView(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'serviceId' => $this->serviceId,
            'serviceName' => $this->serviceName,
            'period' => $this->period,
            'rating' => $this->rating,
            'needMet' => $this->needMet,
            'comment' => $this->comment,
            'context' => $this->context,
            'contextReference' => $this->contextReference,
            'status' => $this->status,
            'response' => $this->response,
            'respondedAt' => $this->respondedAt?->format(DATE_ATOM),
            'createdAt' => $this->createdAt->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }
}
