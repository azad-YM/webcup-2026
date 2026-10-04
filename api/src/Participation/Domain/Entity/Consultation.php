<?php

declare(strict_types=1);

namespace Participation\Domain\Entity;

use Participation\Domain\Text;
use Shared\Domain\Exception\DomainException;

/**
 * Question put to the inhabitants over an opening period (F65, F66), attached or not to a project.
 *
 * - `opinion` (« avis », F66): free text and/or a simple appreciation; explicitly NOT an official vote.
 * - `consultation` (F65): one choice among the options written by the agents, plus an optional comment.
 *
 * The phase (upcoming, open, closed) is derived from the dates; the aggregated result is public once closed,
 * and the agents then write « Ce que la ville en a retenu » (the outcome).
 */
final class Consultation
{
    public const KINDS = ['opinion', 'consultation'];
    public const STATES = ['draft', 'published', 'withdrawn'];
    public const MIN_OPTIONS = 2;
    public const MAX_OPTIONS = 10;

    private ?string $projectId;
    private string $kind;
    private string $title;
    private string $question;
    /** @var list<string> */
    private array $description;
    /** @var list<array{id: string, label: string}> */
    private array $options;
    private \DateTimeImmutable $opensAt;
    private \DateTimeImmutable $closesAt;
    private string $state = 'draft';
    private ?\DateTimeImmutable $publishedAt = null;
    /** @var list<string> */
    private array $outcome = [];
    private ?\DateTimeImmutable $outcomeAt = null;
    private \DateTimeImmutable $updatedAt;
    private \DateTimeImmutable $createdAt;

    private function __construct(public readonly string $id, \DateTimeImmutable $now)
    {
        $this->createdAt = $now;
    }

    /** @param array{projectId: ?string, kind: string, title: string, question: string, description: list<string>, options: list<string>, opensAt: \DateTimeImmutable, closesAt: \DateTimeImmutable} $content */
    public static function draft(string $id, array $content, \DateTimeImmutable $now): self
    {
        $consultation = new self($id, $now);
        $consultation->revise($content, false, $now);

        return $consultation;
    }

    /**
     * Validates the whole content before changing anything. Once a contribution exists, the kind and the
     * options are frozen: changing them would change the meaning of the answers already given.
     *
     * @param array{projectId: ?string, kind: string, title: string, question: string, description: list<string>, options: list<string>, opensAt: \DateTimeImmutable, closesAt: \DateTimeImmutable} $content
     */
    public function revise(array $content, bool $hasContributions, \DateTimeImmutable $now): void
    {
        if (!in_array($content['kind'], self::KINDS, true)) {
            throw new DomainException('Type inconnu (opinion, consultation).');
        }
        if ($content['closesAt'] <= $content['opensAt']) {
            throw new DomainException('La clôture doit suivre l’ouverture.');
        }
        $title = Text::required($content['title'], 200, 'Titre');
        $question = Text::required($content['question'], 1000, 'Question');
        $description = Text::paragraphs($content['description'], 'Contexte', false);
        $options = $content['kind'] === 'consultation' ? self::normalizeOptions($content['options']) : [];
        if ($hasContributions && ($content['kind'] !== $this->kind || $options !== $this->options)) {
            throw new DomainException('Des habitants ont déjà répondu : le type et les choix proposés ne peuvent plus changer.');
        }

        $this->projectId = $content['projectId'] === null || trim($content['projectId']) === '' ? null : trim($content['projectId']);
        $this->kind = $content['kind'];
        $this->title = $title;
        $this->question = $question;
        $this->description = $description;
        $this->options = $options;
        $this->opensAt = $content['opensAt'];
        $this->closesAt = $content['closesAt'];
        $this->updatedAt = $now;
    }

    public function moveTo(string $state, \DateTimeImmutable $now): void
    {
        if (!in_array($state, self::STATES, true)) {
            throw new DomainException('État de publication inconnu (draft, published, withdrawn).');
        }
        $this->state = $state;
        if ($state === 'published') {
            $this->publishedAt ??= $now;
        }
    }

    /** « Ce que la ville en a retenu » : written by the agents once the consultation is closed (empty text removes it). */
    public function recordOutcome(array $paragraphs, \DateTimeImmutable $now): void
    {
        if (!$this->isPublished() || $this->phase($now) !== 'closed') {
            throw new DomainException('Le compte rendu se rédige après la clôture d’une consultation publiée.');
        }
        $this->outcome = Text::paragraphs($paragraphs, 'Ce que la ville en a retenu', false);
        $this->outcomeAt = $this->outcome === [] ? null : $now;
        $this->updatedAt = $now;
    }

    /** Checks an answer against the kind of the consultation; returns the normalized answer. */
    public function acceptAnswer(?string $choice, ?string $rating, ?string $comment, \DateTimeImmutable $now): array
    {
        if (!$this->isPublished() || $this->phase($now) !== 'open') {
            throw new DomainException('Cette consultation n’est pas ouverte : il n’est pas possible de répondre.');
        }
        $comment = Text::optional($comment, Contribution::COMMENT_MAX, 'Commentaire');
        $choice = $choice === null || trim($choice) === '' ? null : trim($choice);
        $rating = $rating === null || trim($rating) === '' ? null : trim($rating);
        if ($this->kind === 'consultation') {
            if ($choice === null || !in_array($choice, array_column($this->options, 'id'), true)) {
                throw new DomainException('Choisissez l’une des réponses proposées.');
            }
            $rating = null;
        } else {
            $choice = null;
            if ($rating !== null && !in_array($rating, Contribution::RATINGS, true)) {
                throw new DomainException('Appréciation inconnue (positive, mixed, negative).');
            }
            if ($rating === null && $comment === null) {
                throw new DomainException('Donnez une appréciation ou écrivez votre avis.');
            }
        }

        return ['choice' => $choice, 'rating' => $rating, 'comment' => $comment];
    }

    public function phase(\DateTimeImmutable $now): string
    {
        return match (true) {
            $now < $this->opensAt => 'upcoming',
            $now < $this->closesAt => 'open',
            default => 'closed',
        };
    }

    public function isPublished(): bool { return $this->state === 'published'; }

    public function projectId(): ?string { return $this->projectId; }

    public function title(): string { return $this->title; }

    public function kind(): string { return $this->kind; }

    public function closesAt(): \DateTimeImmutable { return $this->closesAt; }

    /** @return list<array{id: string, label: string}> */
    public function options(): array { return $this->options; }

    /**
     * Public view; `results` is given only once closed (or always for the agents).
     *
     * @param array{total: int, choices: array<string, int>, ratings: array<string, int>, comments: int} $tally
     * @return array<string, mixed>
     */
    public function publicView(\DateTimeImmutable $now, array $tally, bool $withResults = false): array
    {
        $phase = $this->phase($now);
        $showResults = $withResults || $phase === 'closed';

        return [
            'id' => $this->id,
            'projectId' => $this->projectId,
            'kind' => $this->kind,
            'official' => false,
            'title' => $this->title,
            'question' => $this->question,
            'description' => $this->description,
            'options' => $this->options,
            'opensAt' => $this->opensAt->format(DATE_ATOM),
            'closesAt' => $this->closesAt->format(DATE_ATOM),
            'phase' => $phase,
            'contributionCount' => $tally['total'],
            'results' => $showResults ? $this->results($tally) : null,
            'outcome' => $this->outcome === [] ? null : ['text' => $this->outcome, 'publishedAt' => $this->outcomeAt?->format(DATE_ATOM)],
            'publishedAt' => $this->publishedAt?->format(DATE_ATOM),
        ];
    }

    /**
     * @param array{total: int, choices: array<string, int>, ratings: array<string, int>, comments: int} $tally
     * @return array<string, mixed>
     */
    public function managementView(\DateTimeImmutable $now, array $tally): array
    {
        return $this->publicView($now, $tally, true) + [
            'state' => $this->state,
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
            'createdAt' => $this->createdAt->format(DATE_ATOM),
        ];
    }

    /**
     * @param array{total: int, choices: array<string, int>, ratings: array<string, int>, comments: int} $tally
     * @return array<string, mixed>
     */
    private function results(array $tally): array
    {
        return [
            'total' => $tally['total'],
            'choices' => array_map(static fn (array $option): array => $option + ['count' => $tally['choices'][$option['id']] ?? 0], $this->options),
            'ratings' => $this->kind === 'opinion'
                ? array_map(static fn (string $rating): array => ['rating' => $rating, 'count' => $tally['ratings'][$rating] ?? 0], Contribution::RATINGS)
                : [],
            'comments' => $tally['comments'],
        ];
    }

    /**
     * @param array<mixed> $labels
     * @return list<array{id: string, label: string}>
     */
    private static function normalizeOptions(array $labels): array
    {
        $options = [];
        foreach ($labels as $label) {
            $label = Text::required(is_string($label) ? $label : '', 200, 'Choix proposé');
            $options[] = ['id' => (string) (count($options) + 1), 'label' => $label];
        }
        if (count($options) < self::MIN_OPTIONS || count($options) > self::MAX_OPTIONS) {
            throw new DomainException(sprintf('Une consultation propose de %d à %d choix.', self::MIN_OPTIONS, self::MAX_OPTIONS));
        }

        return $options;
    }
}
