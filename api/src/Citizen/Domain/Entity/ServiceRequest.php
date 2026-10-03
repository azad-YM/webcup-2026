<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\ServiceRequestStatusChanged;
use Citizen\Domain\Event\ServiceRequestSubmitted;
use Citizen\Domain\Exception\InvalidRequestTransition;
use Shared\Domain\Model\AggregateRoot;

/**
 * Demande d'un citoyen à la mairie : message (`contact`) ou signalement sur l'espace public (`report`).
 * Le service concerné n'est référencé que par son identifiant ; chaque changement de statut ajoute une étape horodatée.
 */
class ServiceRequest
{
    use AggregateRoot;

    public const TYPE_CONTACT = 'contact';
    public const TYPE_REPORT = 'report';
    public const TYPES = [self::TYPE_CONTACT, self::TYPE_REPORT];

    public const SUBMITTED = 'submitted';
    public const ACKNOWLEDGED = 'acknowledged';
    public const IN_PROGRESS = 'in_progress';
    public const RESOLVED = 'resolved';
    public const REJECTED = 'rejected';
    public const STATUSES = [self::SUBMITTED, self::ACKNOWLEDGED, self::IN_PROGRESS, self::RESOLVED, self::REJECTED];

    /** Transitions autorisées depuis chaque statut ; `resolved` et `rejected` sont finaux. */
    private const TRANSITIONS = [
        self::SUBMITTED => [self::ACKNOWLEDGED, self::IN_PROGRESS, self::REJECTED],
        self::ACKNOWLEDGED => [self::IN_PROGRESS, self::RESOLVED, self::REJECTED],
        self::IN_PROGRESS => [self::RESOLVED, self::REJECTED],
        self::RESOLVED => [],
        self::REJECTED => [],
    ];

    public const SUBJECT_MAX = 160;
    public const DESCRIPTION_MAX = 5000;
    public const LOCATION_MAX = 255;
    public const SERVICE_ID_MAX = 100;
    public const COMMENT_MAX = 2000;

    private string $status = self::SUBMITTED;
    /** @var list<array{status: string, at: string, comment: ?string}> */
    private array $steps = [];
    private \DateTimeImmutable $updatedAt;
    private int $version = 1;
    /** F52 : signalement rendu visible des autres habitants (sans données personnelles), sur choix de l'auteur. */
    private bool $isPublic = false;

    private function __construct(
        public readonly string $id,
        public readonly string $citizenId,
        public readonly string $reference,
        public readonly string $type,
        public readonly string $subject,
        public readonly string $description,
        public readonly ?string $location,
        public readonly ?string $serviceId,
        public readonly \DateTimeImmutable $createdAt,
    ) {
        $this->updatedAt = $createdAt;
    }

    public static function submit(
        string $id,
        string $citizenId,
        string $reference,
        string $type,
        string $subject,
        string $description,
        ?string $location,
        ?string $serviceId,
        \DateTimeImmutable $at,
        bool $isPublic = false,
    ): self {
        $subject = trim($subject);
        $description = trim($description);
        $location = self::normalize($location);
        $serviceId = self::normalize($serviceId);
        if (!in_array($type, self::TYPES, true)) {
            throw new \DomainException('Unknown request type.');
        }
        if ($subject === '' || mb_strlen($subject) > self::SUBJECT_MAX) {
            throw new \DomainException('A subject of at most 160 characters is required.');
        }
        if ($description === '' || mb_strlen($description) > self::DESCRIPTION_MAX) {
            throw new \DomainException('A description of at most 5000 characters is required.');
        }
        if (mb_strlen($location ?? '') > self::LOCATION_MAX || mb_strlen($serviceId ?? '') > self::SERVICE_ID_MAX) {
            throw new \DomainException('Location or service identifier too long.');
        }
        if ($type === self::TYPE_REPORT && $location === null) {
            throw new \DomainException('A report requires a location.');
        }

        $request = new self($id, $citizenId, $reference, $type, $subject, $description, $location, $serviceId, $at);
        // Seul un signalement sur l'espace public peut être partagé ; un message à la mairie reste privé.
        $request->isPublic = $isPublic && $type === self::TYPE_REPORT;
        $request->steps[] = ['status' => self::SUBMITTED, 'at' => $at->format(\DateTimeInterface::ATOM), 'comment' => null];
        $request->record(new ServiceRequestSubmitted($id, $citizenId, $reference));

        return $request;
    }

    /** Fait avancer la demande ; un rejet exige un motif, communiqué au citoyen. */
    public function changeStatus(string $status, ?string $comment, \DateTimeImmutable $at): void
    {
        $comment = self::normalize($comment);
        if (!in_array($status, $this->allowedTransitions(), true)) {
            throw new InvalidRequestTransition(sprintf('A request cannot go from "%s" to "%s".', $this->status, $status));
        }
        if (mb_strlen($comment ?? '') > self::COMMENT_MAX) {
            throw new \DomainException('The comment must not exceed 2000 characters.');
        }
        if ($status === self::REJECTED && $comment === null) {
            throw new \DomainException('A rejection requires a reason.');
        }
        $previous = $this->status;
        $this->status = $status;
        $this->updatedAt = $at;
        $this->steps[] = ['status' => $status, 'at' => $at->format(\DateTimeInterface::ATOM), 'comment' => $comment];
        $this->record(new ServiceRequestStatusChanged($this->id, $this->citizenId, $this->reference, $previous, $status));
    }

    /** @return list<string> */
    public function allowedTransitions(): array
    {
        return self::TRANSITIONS[$this->status];
    }

    public function status(): string { return $this->status; }
    public function isPublic(): bool { return $this->isPublic; }

    /** Un soutien n'a de sens que sur un signalement public encore en cours. */
    public function canBeSupported(): bool
    {
        return $this->isPublic && !in_array($this->status, [self::RESOLVED, self::REJECTED], true);
    }
    public function updatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    /** @return list<array{status: string, at: string, comment: ?string}> */
    public function steps(): array { return $this->steps; }

    private static function normalize(?string $value): ?string
    {
        $value = trim($value ?? '');

        return $value === '' ? null : $value;
    }
}
