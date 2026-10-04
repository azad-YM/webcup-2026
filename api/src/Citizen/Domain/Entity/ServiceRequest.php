<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\ServiceRequestStatusChanged;
use Citizen\Domain\Event\ServiceRequestSubmitted;
use Citizen\Domain\Event\ServiceRequestUpdated;
use Citizen\Domain\Exception\InvalidRequestTransition;
use Citizen\Domain\Service\RequestTriage;
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

    public const DISTRICT_MAX = 100;
    public const PRIORITY_REASON_MAX = 255;
    public const PRIORITY_AUTO = 'auto';
    public const PRIORITY_AGENT = 'agent';

    /** F80 : priorité proposée par les règles (`auto`) ou fixée par un agent (`agent`), avec son motif. */
    private string $priority = RequestTriage::NORMAL;
    private int $priorityRank = 2;
    private ?string $priorityReason = null;
    private string $prioritySource = self::PRIORITY_AUTO;
    /** F79/F86 : catégorie déduite du texte (`medical_emergency` pour une urgence médicale). */
    private string $category = 'other';
    /** F79 : quartier concerné (choisi à l'envoi, sinon celui du profil). */
    private ?string $district = null;
    /** F86 : urgence médicale cochée par l'habitant ou détectée dans le texte. */
    private bool $medicalEmergency = false;
    private ?\DateTimeImmutable $emergencyHandledAt = null;
    private ?string $emergencyHandledBy = null;
    /** F75 : demandes liées par un agent comme un même problème. */
    private ?string $groupId = null;

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
        ?string $district = null,
        bool $medicalEmergency = false,
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
        $district = self::normalize($district);
        if (mb_strlen($district ?? '') > self::DISTRICT_MAX) {
            throw new \DomainException('District too long.');
        }
        $request->district = $district;
        // F86 : la case cochée suffit ; sinon les mots du texte peuvent révéler une urgence médicale.
        $text = $subject . ' ' . $description;
        $request->medicalEmergency = $medicalEmergency || RequestTriage::detectMedicalEmergency($text);
        $request->category = RequestTriage::category($text, $request->medicalEmergency);
        $base = RequestTriage::basePriority($type, $request->category, $request->medicalEmergency, $text);
        $request->applyPriority($base['priority'], $base['reason']);
        // Une urgence médicale reste privée : elle concerne une personne, pas l'espace public.
        if ($request->medicalEmergency) {
            $request->isPublic = false;
        }
        $request->steps[] = ['status' => self::SUBMITTED, 'at' => $at->format(\DateTimeInterface::ATOM), 'comment' => null];
        $request->record(new ServiceRequestSubmitted($id, $citizenId, $reference, $request->medicalEmergency, $request->priority));

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

    /**
     * F80 : recalcule une priorité automatique (ancienneté, soutiens publics). Sans effet sur une priorité
     * fixée par un agent ni sur une demande close. Retourne vrai si la priorité a changé.
     */
    public function reassessPriority(int $supports, \DateTimeImmutable $now): bool
    {
        if ($this->prioritySource !== self::PRIORITY_AUTO || $this->isClosed()) {
            return false;
        }
        $text = $this->subject . ' ' . $this->description;
        $base = RequestTriage::basePriority($this->type, $this->category, $this->medicalEmergency, $text);
        $next = RequestTriage::escalate($base['priority'], $base['reason'], $this->status === self::SUBMITTED, $this->createdAt, $now, $supports);
        if ($next['priority'] === $this->priority && $next['reason'] === $this->priorityReason) {
            return false;
        }
        $changed = $next['priority'] !== $this->priority;
        $this->applyPriority($next['priority'], $next['reason']);
        if ($changed) {
            $this->record(new ServiceRequestUpdated($this->id, $this->citizenId, $this->reference, 'priority'));
        }

        return $changed;
    }

    /** F80 : un agent fixe la priorité ; le motif est facultatif. Une urgence médicale non prise en charge reste urgente. */
    public function setPriority(string $priority, ?string $reason, \DateTimeImmutable $at): void
    {
        if (!in_array($priority, RequestTriage::PRIORITIES, true)) {
            throw new \DomainException('Unknown priority.');
        }
        $reason = self::normalize($reason);
        if (mb_strlen($reason ?? '') > self::PRIORITY_REASON_MAX) {
            throw new \DomainException('The reason must not exceed 255 characters.');
        }
        if ($this->medicalEmergency && $this->emergencyHandledAt === null && $priority !== RequestTriage::URGENT) {
            throw new \DomainException('A medical emergency stays urgent until it is taken in charge.');
        }
        $this->prioritySource = self::PRIORITY_AGENT;
        $this->applyPriority($priority, $reason ?? 'Priorité fixée par un agent.');
        $this->updatedAt = $at;
        $this->record(new ServiceRequestUpdated($this->id, $this->citizenId, $this->reference, 'priority'));
    }

    /** F86 : un agent prend en charge l'urgence médicale ; horodaté, la demande passe « prise en charge » si elle attendait. */
    public function markEmergencyHandled(string $agentUserId, \DateTimeImmutable $at): void
    {
        if (!$this->medicalEmergency) {
            throw new \DomainException('This request is not a medical emergency.');
        }
        if ($this->emergencyHandledAt !== null) {
            throw new InvalidRequestTransition('The emergency has already been taken in charge.');
        }
        $this->emergencyHandledAt = $at;
        $this->emergencyHandledBy = $agentUserId;
        $this->updatedAt = $at;
        if ($this->status === self::SUBMITTED) {
            $this->changeStatus(self::ACKNOWLEDGED, 'Votre signalement d’urgence médicale a été vu par un agent de la mairie. Si la situation est grave, appelez le 15 ou le 112.', $at);
        }
        $this->record(new ServiceRequestUpdated($this->id, $this->citizenId, $this->reference, 'emergency_handled'));
    }

    /** F75 : rattache la demande à un groupe « même problème ». */
    public function linkToGroup(string $groupId, \DateTimeImmutable $at): void
    {
        if ($this->groupId === $groupId) {
            return;
        }
        $this->groupId = $groupId;
        $this->updatedAt = $at;
        $this->record(new ServiceRequestUpdated($this->id, $this->citizenId, $this->reference, 'group'));
    }

    public function unlinkFromGroup(\DateTimeImmutable $at): void
    {
        if ($this->groupId === null) {
            return;
        }
        $this->groupId = null;
        $this->updatedAt = $at;
        $this->record(new ServiceRequestUpdated($this->id, $this->citizenId, $this->reference, 'group'));
    }

    public function isClosed(): bool
    {
        return in_array($this->status, [self::RESOLVED, self::REJECTED], true);
    }

    public function priority(): string { return $this->priority; }
    public function priorityReason(): ?string { return $this->priorityReason; }
    public function prioritySource(): string { return $this->prioritySource; }
    public function category(): string { return $this->category; }
    public function district(): ?string { return $this->district; }
    public function isMedicalEmergency(): bool { return $this->medicalEmergency; }
    public function emergencyHandledAt(): ?\DateTimeImmutable { return $this->emergencyHandledAt; }
    public function groupId(): ?string { return $this->groupId; }

    private function applyPriority(string $priority, ?string $reason): void
    {
        $this->priority = $priority;
        $this->priorityRank = RequestTriage::PRIORITY_RANKS[$priority];
        $this->priorityReason = $reason === null ? null : mb_substr($reason, 0, self::PRIORITY_REASON_MAX);
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
