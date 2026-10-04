<?php

declare(strict_types=1);

namespace Administration\Domain\Entity;

use Administration\Domain\VO\District;
use Shared\Domain\Exception\DomainException;

/**
 * F97 (L28) : ligne de transport municipal, avec son état et ses solutions de remplacement.
 *
 * Une ligne `interrupted` (interrompue) ou `disrupted` (perturbée) doit expliquer la situation aux habitants
 * (message obligatoire) et, si elle est interrompue, proposer au moins une solution de remplacement : navette de
 * substitution, autre ligne, transport à la demande, à pied ou à vélo. Revenir à `normal` efface ces informations.
 */
final class TransportLine
{
    public const MODES = ['shuttle', 'tram', 'bus', 'cable', 'rover'];
    public const STATUSES = ['normal', 'disrupted', 'interrupted'];
    public const REPLACEMENT_KINDS = ['substitute-shuttle', 'other-line', 'on-demand', 'walk', 'bike'];
    public const MAX_STOPS = 40;
    public const MAX_REPLACEMENTS = 6;

    private string $code;
    private string $name;
    private string $mode;
    /** @var list<string> arrêts dans l'ordre du parcours */
    private array $stops;
    /** @var list<string> quartiers desservis (liste fermée) */
    private array $districts;
    private string $frequency;
    private string $status = 'normal';
    private string $statusMessage = '';
    private ?\DateTimeImmutable $disruptedSince = null;
    private ?\DateTimeImmutable $returnAt = null;
    /** @var list<array{kind: string, label: string, details: string, lineId: ?string}> */
    private array $replacements = [];
    private \DateTimeImmutable $updatedAt;

    /** @param array<string, mixed> $data */
    private function __construct(public readonly string $id, array $data, \DateTimeImmutable $now)
    {
        $this->apply($data, $now);
    }

    /** @param array<string, mixed> $data */
    public static function create(string $id, array $data, \DateTimeImmutable $now): self
    {
        if (!preg_match('/^[a-z0-9][a-z0-9-]{0,39}$/', $id)) {
            throw new DomainException('Identifiant de ligne invalide : minuscules, chiffres et tirets.');
        }

        return new self($id, $data, $now);
    }

    /** @param array<string, mixed> $data */
    public function revise(array $data, \DateTimeImmutable $now): void
    {
        $this->apply($data, $now);
    }

    public function status(): string { return $this->status; }

    public function name(): string { return $this->name; }

    /** Validates everything before changing anything. @param array<string, mixed> $data */
    private function apply(array $data, \DateTimeImmutable $now): void
    {
        $code = self::text($data['code'] ?? '', 10, 'Numéro de ligne');
        $name = self::text($data['name'] ?? '', 160, 'Nom de la ligne');
        $mode = (string) ($data['mode'] ?? '');
        if (!in_array($mode, self::MODES, true)) {
            throw new DomainException('Mode de transport inconnu.');
        }
        $stops = self::list($data['stops'] ?? [], 120, 'Arrêt');
        if (count($stops) < 2 || count($stops) > self::MAX_STOPS) {
            throw new DomainException(sprintf('Une ligne compte de 2 à %d arrêts.', self::MAX_STOPS));
        }
        $districts = self::list($data['districts'] ?? [], 40, 'Quartier');
        foreach ($districts as $district) {
            if (!District::exists($district)) {
                throw new DomainException(sprintf('Quartier inconnu : %s.', $district));
            }
        }
        $frequency = self::text($data['frequency'] ?? '', 200, 'Fréquence', false);
        $status = (string) ($data['status'] ?? 'normal');
        if (!in_array($status, self::STATUSES, true)) {
            throw new DomainException('État de ligne inconnu (normal, disrupted, interrupted).');
        }
        $message = '';
        $since = null;
        $returnAt = null;
        $replacements = [];
        if ($status !== 'normal') {
            $message = self::text($data['statusMessage'] ?? '', 1000, 'Message aux voyageurs');
            $since = self::date($data['disruptedSince'] ?? null) ?? ($this->status === $status ? $this->disruptedSince : null) ?? $now;
            $returnAt = self::date($data['returnAt'] ?? null);
            $replacements = self::replacements($data['replacements'] ?? []);
            if ($status === 'interrupted' && $replacements === []) {
                throw new DomainException('Une ligne interrompue doit proposer au moins une solution de remplacement.');
            }
        }

        $this->code = $code;
        $this->name = $name;
        $this->mode = $mode;
        $this->stops = $stops;
        $this->districts = $districts;
        $this->frequency = $frequency;
        $this->status = $status;
        $this->statusMessage = $message;
        $this->disruptedSince = $since;
        $this->returnAt = $returnAt;
        $this->replacements = $replacements;
        $this->updatedAt = $now;
    }

    /** @return array<string, mixed> */
    public function view(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'mode' => $this->mode,
            'stops' => $this->stops,
            'districts' => $this->districts,
            'frequency' => $this->frequency,
            'status' => $this->status,
            'statusMessage' => $this->statusMessage,
            'disruptedSince' => $this->disruptedSince?->format(DATE_ATOM),
            'returnAt' => $this->returnAt?->format(DATE_ATOM),
            'replacements' => $this->replacements,
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }

    /** @return list<array{kind: string, label: string, details: string, lineId: ?string}> */
    private static function replacements(mixed $items): array
    {
        if (!is_array($items) || count($items) > self::MAX_REPLACEMENTS) {
            throw new DomainException(sprintf('De 0 à %d solutions de remplacement.', self::MAX_REPLACEMENTS));
        }
        $result = [];
        foreach ($items as $item) {
            if (!is_array($item) || !in_array($item['kind'] ?? null, self::REPLACEMENT_KINDS, true)) {
                throw new DomainException('Type de solution de remplacement inconnu.');
            }
            $lineId = isset($item['lineId']) && is_string($item['lineId']) && $item['lineId'] !== '' ? mb_substr($item['lineId'], 0, 40) : null;
            $result[] = [
                'kind' => (string) $item['kind'],
                'label' => self::text($item['label'] ?? '', 160, 'Solution de remplacement'),
                'details' => self::text($item['details'] ?? '', 600, 'Détail de la solution', false),
                'lineId' => $lineId,
            ];
        }

        return $result;
    }

    /** @return list<string> */
    private static function list(mixed $items, int $max, string $label): array
    {
        if (!is_array($items)) {
            throw new DomainException(sprintf('%s : liste attendue.', $label));
        }
        $values = [];
        foreach ($items as $item) {
            $value = trim((string) $item);
            if ($value === '') {
                continue;
            }
            if (mb_strlen($value) > $max) {
                throw new DomainException(sprintf('%s : %d caractères au plus.', $label, $max));
            }
            if (!in_array($value, $values, true)) {
                $values[] = $value;
            }
        }

        return $values;
    }

    private static function text(mixed $value, int $max, string $label, bool $required = true): string
    {
        $value = trim((string) $value);
        if ($required && $value === '') {
            throw new DomainException(sprintf('%s : champ obligatoire.', $label));
        }
        if (mb_strlen($value) > $max) {
            throw new DomainException(sprintf('%s : %d caractères au plus.', $label, $max));
        }

        return $value;
    }

    private static function date(mixed $value): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        try {
            return new \DateTimeImmutable((string) $value);
        } catch (\Exception) {
            throw new DomainException('Date invalide.');
        }
    }
}
