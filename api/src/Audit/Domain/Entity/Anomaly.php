<?php

declare(strict_types=1);

namespace Audit\Domain\Entity;

/**
 * F85 : une activité inhabituelle ou une information incohérente repérée par le détecteur.
 *
 * Identifiée par une empreinte stable (règle + cible + période) : un même phénomène revu à l'analyse suivante
 * augmente `occurrences` au lieu de créer une nouvelle ligne. Statut : `new` (nouvelle), `seen` (vue),
 * `handled` (traitée). Les éléments liés sont des identifiants et libellés masqués, jamais des données sensibles.
 */
class Anomaly
{
    public const NEW = 'new';
    public const SEEN = 'seen';
    public const HANDLED = 'handled';
    public const STATUSES = [self::NEW, self::SEEN, self::HANDLED];

    public const INFO = 'info';
    public const WARNING = 'warning';
    public const CRITICAL = 'critical';
    public const SEVERITIES = [self::INFO, self::WARNING, self::CRITICAL];

    private string $status = self::NEW;
    private int $occurrences = 1;
    private ?string $reaction = null;
    private ?string $handledBy = null;
    private ?\DateTimeImmutable $handledAt = null;
    private \DateTimeImmutable $lastSeenAt;

    /** @param list<array{type: string, id: string, label: string}> $related */
    private function __construct(
        public readonly string $id,
        public readonly string $fingerprint,
        public readonly string $rule,
        public readonly string $category,
        private string $severity,
        private string $title,
        private string $explanation,
        private array $related,
        public readonly \DateTimeImmutable $detectedAt,
    ) {
        $this->lastSeenAt = $detectedAt;
    }

    /** @param list<array{type: string, id: string, label: string}> $related */
    public static function detect(string $id, string $fingerprint, string $rule, string $category, string $severity, string $title, string $explanation, array $related, \DateTimeImmutable $at): self
    {
        if (!in_array($severity, self::SEVERITIES, true)) {
            throw new \InvalidArgumentException('Unknown anomaly severity.');
        }

        return new self($id, mb_substr($fingerprint, 0, 64), mb_substr($rule, 0, 60), mb_substr($category, 0, 20), $severity, mb_substr($title, 0, 200), mb_substr($explanation, 0, 2000), array_slice($related, 0, 20), $at);
    }

    /**
     * Le même phénomène est encore observé : explication et éléments actualisés, gravité au plus haut constaté.
     * Une anomalie traitée qui s'aggrave (gravité supérieure) redevient nouvelle.
     *
     * @param list<array{type: string, id: string, label: string}> $related
     */
    public function observeAgain(string $severity, string $explanation, array $related, \DateTimeImmutable $at): void
    {
        ++$this->occurrences;
        $this->lastSeenAt = $at;
        $this->explanation = mb_substr($explanation, 0, 2000);
        $this->related = array_slice($related, 0, 20);
        if (self::rank($severity) > self::rank($this->severity)) {
            $this->severity = $severity;
            if ($this->status === self::HANDLED) {
                $this->status = self::NEW;
                $this->handledAt = null;
                $this->handledBy = null;
            }
        }
    }

    public function changeStatus(string $status, string $by, \DateTimeImmutable $at): void
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new \DomainException('Statut inconnu : nouvelle, vue ou traitée.');
        }
        $this->status = $status;
        $this->handledBy = $status === self::HANDLED ? mb_substr($by, 0, 180) : null;
        $this->handledAt = $status === self::HANDLED ? $at : null;
    }

    public function recordReaction(string $reaction): void
    {
        $this->reaction = mb_substr(trim(($this->reaction ?? '').' '.$reaction), 0, 500);
    }

    public function status(): string { return $this->status; }
    public function severity(): string { return $this->severity; }
    public function title(): string { return $this->title; }
    public function explanation(): string { return $this->explanation; }
    /** @return list<array{type: string, id: string, label: string}> */
    public function related(): array { return $this->related; }
    public function occurrences(): int { return $this->occurrences; }
    public function reaction(): ?string { return $this->reaction; }
    public function handledBy(): ?string { return $this->handledBy; }
    public function handledAt(): ?\DateTimeImmutable { return $this->handledAt; }
    public function lastSeenAt(): \DateTimeImmutable { return $this->lastSeenAt; }

    public static function rank(string $severity): int
    {
        return (int) array_search($severity, self::SEVERITIES, true);
    }
}
