<?php

declare(strict_types=1);

namespace Communication\Domain\Entity;

use Communication\Domain\Event\AlertPublished;
use Communication\Domain\Event\AlertWithdrawn;
use Communication\Domain\Text;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Model\AggregateRoot;

/**
 * Urgent information of the city (D18, F29, F31): severity, validity period and audience
 * (every inhabitant, one district, or the citizens who consented to health alerts).
 * Recommendations are written by the agents (no generation), as plain paragraphs.
 */
final class Alert
{
    use AggregateRoot;

    public const SEVERITIES = ['info', 'warning', 'critical'];
    public const AUDIENCES = ['all', 'district', 'health'];
    public const STATES = ['draft', 'published', 'withdrawn'];
    /** F73 (L26) : `official` = message officiel du Haut Conseil, signé, toujours adressé à tous les habitants. */
    public const CATEGORIES = ['standard', 'official'];

    private string $title;
    private string $message;
    private string $severity;
    private string $audience;
    private ?string $district;
    private \DateTimeImmutable $startsAt;
    private \DateTimeImmutable $endsAt;
    /** @var list<string> */
    private array $recommendations;
    private string $state = 'draft';
    private string $category = 'standard';
    private ?string $signatory = null;
    private ?\DateTimeImmutable $publishedAt = null;
    private \DateTimeImmutable $updatedAt;

    private function __construct(public readonly string $id) {}

    /**
     * @param array{title: string, message: string, severity: string, audience: string, district: ?string, startsAt: \DateTimeImmutable, endsAt: \DateTimeImmutable, recommendations: list<string>} $content
     */
    public static function draft(string $id, array $content, \DateTimeImmutable $now): self
    {
        $alert = new self($id);
        $alert->revise($content, $now);

        return $alert;
    }

    /**
     * Validates the whole content before changing anything.
     *
     * @param array{title: string, message: string, severity: string, audience: string, district: ?string, startsAt: \DateTimeImmutable, endsAt: \DateTimeImmutable, recommendations: list<string>, category?: string, signatory?: ?string} $content
     */
    public function revise(array $content, \DateTimeImmutable $now): void
    {
        if (!in_array($content['severity'], self::SEVERITIES, true)) {
            throw new DomainException('Gravité inconnue (info, warning, critical).');
        }
        if (!in_array($content['audience'], self::AUDIENCES, true)) {
            throw new DomainException('Audience inconnue (all, district, health).');
        }
        $category = $content['category'] ?? 'standard';
        if (!in_array($category, self::CATEGORIES, true)) {
            throw new DomainException('Type d’alerte inconnu (standard, official).');
        }
        $signatory = null;
        if ($category === 'official') {
            if ($content['audience'] !== 'all') {
                throw new DomainException('Un message officiel s’adresse à tous les habitants.');
            }
            $signatory = Text::required((string) ($content['signatory'] ?? ''), 160, 'Signataire');
        }
        $district = $content['audience'] === 'district' ? trim((string) $content['district']) : null;
        if ($district === '') {
            throw new DomainException('Choisissez le quartier concerné.');
        }
        if ($content['endsAt'] <= $content['startsAt']) {
            throw new DomainException('La fin de validité doit suivre son début.');
        }
        $title = Text::required($content['title'], 200, 'Titre');
        $message = Text::required($content['message'], 5000, 'Message');
        $recommendations = Text::paragraphs($content['recommendations'], 'Recommandations', false);

        $this->title = $title;
        $this->message = $message;
        $this->severity = $content['severity'];
        $this->audience = $content['audience'];
        $this->district = $district;
        $this->startsAt = $content['startsAt'];
        $this->endsAt = $content['endsAt'];
        $this->recommendations = $recommendations;
        $this->category = $category;
        $this->signatory = $signatory;
        $this->updatedAt = $now;
    }

    /**
     * Saving a published alert announces it again (its content or period may have changed).
     * Leaving the published state withdraws it from its audience.
     */
    public function moveTo(string $state, \DateTimeImmutable $now, ?string $previousAudience = null, ?string $previousDistrict = null): void
    {
        if (!in_array($state, self::STATES, true)) {
            throw new DomainException('État d’alerte inconnu (draft, published, withdrawn).');
        }
        $wasPublished = $this->state === 'published';
        $this->state = $state;
        $audienceChanged = $previousAudience !== null && ($previousAudience !== $this->audience || $previousDistrict !== $this->district);
        if ($wasPublished && ($state !== 'published' || $audienceChanged)) {
            $this->record(new AlertWithdrawn($this->id, $this->severity, $previousAudience ?? $this->audience, $previousAudience !== null ? $previousDistrict : $this->district));
        }
        if ($state === 'published') {
            $this->publishedAt ??= $now;
            $this->record(new AlertPublished($this->id, $this->severity, $this->audience, $this->district));
        }
    }

    public function audience(): string { return $this->audience; }

    public function district(): ?string { return $this->district; }

    public function startsAt(): \DateTimeImmutable { return $this->startsAt; }

    public function isOfficial(): bool { return $this->category === 'official'; }

    /** Published once (archive of the official messages), whether still valid or not. */
    public function wasPublished(): bool { return $this->state === 'published' && $this->publishedAt !== null; }

    public function publishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }

    public function isActive(\DateTimeImmutable $now): bool
    {
        return $this->state === 'published' && $this->startsAt <= $now && $now < $this->endsAt;
    }

    /** Whether the alert concerns a reader: everyone, the reader's district, or a reader who consented to health alerts. */
    public function concerns(?string $district, bool $healthConsent): bool
    {
        return match ($this->audience) {
            'all' => true,
            'district' => $district !== null && $district === $this->district,
            'health' => $healthConsent,
            default => false,
        };
    }

    /** @return array<string, mixed> */
    public function publicView(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'severity' => $this->severity,
            'audience' => $this->audience,
            'district' => $this->district,
            'startsAt' => $this->startsAt->format(DATE_ATOM),
            'endsAt' => $this->endsAt->format(DATE_ATOM),
            'recommendations' => $this->recommendations,
            'publishedAt' => $this->publishedAt?->format(DATE_ATOM),
            'category' => $this->category,
            'signatory' => $this->signatory,
        ];
    }

    /** @return array<string, mixed> */
    public function managementView(): array
    {
        return $this->publicView() + ['state' => $this->state, 'updatedAt' => $this->updatedAt->format(DATE_ATOM)];
    }
}
