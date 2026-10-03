<?php

declare(strict_types=1);

namespace Communication\Domain\Entity;

use Communication\Domain\Event\PublicationPublished;
use Communication\Domain\Text;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Model\AggregateRoot;

/**
 * Publication of the city (D06): news, announcement, change of service, practical information.
 * An important publication (F30) is announced to the citizens in their notifications.
 * Life cycle: draft → published → withdrawn (and back to published if needed).
 */
final class Publication
{
    use AggregateRoot;

    public const STATES = ['draft', 'published', 'withdrawn'];

    private string $title;
    private string $category;
    private string $summary;
    /** @var list<string> */
    private array $body;
    private bool $important;
    private string $state = 'draft';
    private ?\DateTimeImmutable $publishedAt = null;
    private \DateTimeImmutable $updatedAt;

    /** @param list<string> $body */
    private function __construct(public readonly string $id, string $title, string $category, string $summary, array $body, bool $important, \DateTimeImmutable $now)
    {
        $this->revise($title, $category, $summary, $body, $important, $now);
    }

    /** @param list<string> $body */
    public static function draft(string $id, string $title, string $category, string $summary, array $body, bool $important, \DateTimeImmutable $now): self
    {
        return new self($id, $title, $category, $summary, $body, $important, $now);
    }

    /** @param list<string> $body */
    public function revise(string $title, string $category, string $summary, array $body, bool $important, \DateTimeImmutable $now): void
    {
        $this->title = Text::required($title, 200, 'Titre');
        $this->category = Text::required($category, 80, 'Catégorie');
        $this->summary = Text::required($summary, 1000, 'Résumé');
        $this->body = Text::paragraphs($body, 'Contenu');
        $this->important = $important;
        $this->updatedAt = $now;
    }

    /** Publishing (again) announces the publication; the first publication date is kept. */
    public function moveTo(string $state, \DateTimeImmutable $now): void
    {
        if (!in_array($state, self::STATES, true)) {
            throw new DomainException('État de publication inconnu (draft, published, withdrawn).');
        }
        $wasPublished = $this->state === 'published';
        $this->state = $state;
        if ($state === 'published') {
            $this->publishedAt ??= $now;
            if (!$wasPublished) {
                $this->record(new PublicationPublished($this->id, $this->important));
            }
        }
    }

    public function isPublished(): bool { return $this->state === 'published'; }

    public function isImportant(): bool { return $this->important; }

    public function publishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }

    /** @return array<string, mixed> */
    public function publicView(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'summary' => $this->summary,
            'body' => $this->body,
            'important' => $this->important,
            'publishedAt' => $this->publishedAt?->format(DATE_ATOM),
        ];
    }

    /** @return array<string, mixed> */
    public function managementView(): array
    {
        return $this->publicView() + ['state' => $this->state, 'updatedAt' => $this->updatedAt->format(DATE_ATOM)];
    }
}
