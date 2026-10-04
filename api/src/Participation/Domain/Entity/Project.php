<?php

declare(strict_types=1);

namespace Participation\Domain\Entity;

use Participation\Domain\Text;
use Shared\Domain\Exception\DomainException;

/**
 * Project of the city shown to the inhabitants (F67): what is being studied, built or finished, where,
 * with dated steps and the next step. Agents write it as a draft, then publish it (or withdraw it).
 */
final class Project
{
    public const STATUSES = ['study', 'in_progress', 'done'];
    public const STATES = ['draft', 'published', 'withdrawn'];
    public const MAX_STEPS = 30;

    private string $title;
    private string $summary;
    /** @var list<string> */
    private array $description;
    private ?string $district;
    private string $status;
    /** @var list<array{label: string, date: string, done: bool}> */
    private array $steps;
    private ?string $nextStep;
    private string $state = 'draft';
    private ?\DateTimeImmutable $publishedAt = null;
    private \DateTimeImmutable $updatedAt;
    private \DateTimeImmutable $createdAt;

    private function __construct(public readonly string $id, \DateTimeImmutable $now)
    {
        $this->createdAt = $now;
    }

    /** @param array{title: string, summary: string, description: list<string>, district: ?string, status: string, steps: list<array<string, mixed>>, nextStep: ?string} $content */
    public static function draft(string $id, array $content, \DateTimeImmutable $now): self
    {
        $project = new self($id, $now);
        $project->revise($content, $now);

        return $project;
    }

    /**
     * Validates the whole content before changing anything. `district` null means the whole city
     * (the closed list of districts is checked by the use case).
     *
     * @param array{title: string, summary: string, description: list<string>, district: ?string, status: string, steps: list<array<string, mixed>>, nextStep: ?string} $content
     */
    public function revise(array $content, \DateTimeImmutable $now): void
    {
        if (!in_array($content['status'], self::STATUSES, true)) {
            throw new DomainException('État du projet inconnu (study, in_progress, done).');
        }
        $title = Text::required($content['title'], 200, 'Titre');
        $summary = Text::required($content['summary'], 1000, 'Résumé');
        $description = Text::paragraphs($content['description'], 'Description');
        $steps = self::steps($content['steps']);
        $nextStep = Text::optional($content['nextStep'], 500, 'Prochaine étape');
        $district = Text::optional($content['district'], 40, 'Quartier');

        $this->title = $title;
        $this->summary = $summary;
        $this->description = $description;
        $this->district = $district;
        $this->status = $content['status'];
        $this->steps = $steps;
        $this->nextStep = $nextStep;
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

    public function isPublished(): bool { return $this->state === 'published'; }

    public function state(): string { return $this->state; }

    public function title(): string { return $this->title; }

    public function district(): ?string { return $this->district; }

    public function status(): string { return $this->status; }

    /** @return array<string, mixed> */
    public function publicView(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'summary' => $this->summary,
            'description' => $this->description,
            'district' => $this->district,
            'status' => $this->status,
            'steps' => $this->steps,
            'nextStep' => $this->nextStep,
            'publishedAt' => $this->publishedAt?->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }

    /** @return array<string, mixed> */
    public function managementView(): array
    {
        return $this->publicView() + ['state' => $this->state, 'createdAt' => $this->createdAt->format(DATE_ATOM)];
    }

    /**
     * @param array<mixed> $values
     * @return list<array{label: string, date: string, done: bool}>
     */
    private static function steps(array $values): array
    {
        if (count($values) > self::MAX_STEPS) {
            throw new DomainException(sprintf('%d étapes maximum.', self::MAX_STEPS));
        }
        $steps = [];
        foreach ($values as $value) {
            if (!is_array($value)) {
                throw new DomainException('Étape invalide.');
            }
            $label = Text::required(is_string($value['label'] ?? null) ? $value['label'] : '', 200, 'Libellé de l’étape');
            $date = is_string($value['date'] ?? null) ? $value['date'] : '';
            $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
            if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
                throw new DomainException(sprintf('Date de l’étape « %s » invalide (AAAA-MM-JJ).', $label));
            }
            $steps[] = ['label' => $label, 'date' => $date, 'done' => (bool) ($value['done'] ?? false)];
        }
        usort($steps, static fn (array $a, array $b): int => $a['date'] <=> $b['date']);

        return $steps;
    }
}
