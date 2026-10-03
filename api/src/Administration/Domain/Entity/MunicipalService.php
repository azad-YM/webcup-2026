<?php

declare(strict_types=1);

namespace Administration\Domain\Entity;

use Shared\Domain\Exception\DomainException;

/**
 * Municipal service of the public catalogue (D05, F28, F32), with its operating state (F38)
 * and, for mobility services, its timetable (F36).
 */
final class MunicipalService
{
    public const CATEGORIES = ['demarches', 'cadre-de-vie', 'sante-solidarite', 'mobilite', 'habitat', 'famille'];
    public const STATUSES = ['available', 'maintenance', 'incident'];

    private string $name;
    private string $category;
    private string $summary;
    private string $description;
    /** @var list<string> */
    private array $actions;
    /** @var array{place: string, hours: string, phone: ?string} */
    private array $contact;
    private bool $featured;
    /** @var list<string> */
    private array $keywords;
    private string $status;
    private string $statusMessage;
    private ?\DateTimeImmutable $returnAt;
    private string $alternative;
    /** @var array{route: string, timetable: string, information: string}|null */
    private ?array $transport;
    private \DateTimeImmutable $updatedAt;

    /** @param array<string, mixed> $data */
    private function __construct(public readonly string $id, array $data, \DateTimeImmutable $now)
    {
        $this->apply($data, $now);
    }

    /** @param array<string, mixed> $data */
    public static function create(string $id, array $data, \DateTimeImmutable $now): self
    {
        if (!preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/', $id)) {
            throw new DomainException('Identifiant de service invalide : minuscules, chiffres et tirets.');
        }

        return new self($id, $data, $now);
    }

    /** @param array<string, mixed> $data */
    public function revise(array $data, \DateTimeImmutable $now): void
    {
        $this->apply($data, $now);
    }

    public function name(): string { return $this->name; }

    public function category(): string { return $this->category; }

    public function featured(): bool { return $this->featured; }

    /** Every term must appear (accent and case insensitive) in the name, summary or keywords. */
    public function matches(string $search): bool
    {
        $terms = preg_split('/\s+/', self::fold($search), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $haystack = self::fold(implode(' ', [$this->name, $this->summary, $this->category, ...$this->keywords]));
        foreach ($terms as $term) {
            if (!str_contains($haystack, $term)) {
                return false;
            }
        }

        return true;
    }

    /** @return array<string, mixed> */
    public function view(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'summary' => $this->summary,
            'description' => $this->description,
            'actions' => $this->actions,
            'contact' => $this->contact,
            'featured' => $this->featured,
            'keywords' => $this->keywords,
            'status' => $this->status,
            'statusMessage' => $this->statusMessage,
            'returnAt' => $this->returnAt?->format(DATE_ATOM),
            'alternative' => $this->alternative,
            'transport' => $this->transport,
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }

    /** @param array<string, mixed> $data */
    private function apply(array $data, \DateTimeImmutable $now): void
    {
        $category = $data['category'] ?? null;
        if (!in_array($category, self::CATEGORIES, true)) {
            throw new DomainException('Thème de service inconnu.');
        }
        $status = $data['status'] ?? 'available';
        if (!in_array($status, self::STATUSES, true)) {
            throw new DomainException('État de service inconnu (available, maintenance, incident).');
        }
        $statusMessage = self::text($data['statusMessage'] ?? '', 2000, 'Message d’état', false);
        if ($status !== 'available' && $statusMessage === '') {
            throw new DomainException('Expliquez la perturbation du service aux habitants.');
        }
        $returnAt = null;
        if ($status !== 'available' && is_string($data['returnAt'] ?? null) && $data['returnAt'] !== '') {
            try {
                $returnAt = new \DateTimeImmutable($data['returnAt']);
            } catch (\Exception) {
                throw new DomainException('Date de retour invalide.');
            }
        }
        $contact = is_array($data['contact'] ?? null) ? $data['contact'] : [];
        $phone = self::text($contact['phone'] ?? '', 100, 'Téléphone', false);
        $transport = null;
        if (is_array($data['transport'] ?? null)) {
            if ($category !== 'mobilite') {
                throw new DomainException('Les horaires de transport concernent un service de mobilité.');
            }
            $transport = [
                'route' => self::text($data['transport']['route'] ?? '', 2000, 'Trajet'),
                'timetable' => self::text($data['transport']['timetable'] ?? '', 5000, 'Horaires'),
                'information' => self::text($data['transport']['information'] ?? '', 5000, 'Informations pratiques', false),
            ];
        }

        $this->name = self::text($data['name'] ?? '', 200, 'Nom');
        $this->category = $category;
        $this->summary = self::text($data['summary'] ?? '', 1000, 'Résumé');
        $this->description = self::text($data['description'] ?? '', 10000, 'Description');
        $this->actions = self::list($data['actions'] ?? [], 'Démarches');
        $this->contact = [
            'place' => self::text($contact['place'] ?? '', 500, 'Lieu'),
            'hours' => self::text($contact['hours'] ?? '', 500, 'Horaires d’accueil'),
            'phone' => $phone === '' ? null : $phone,
        ];
        $this->featured = (bool) ($data['featured'] ?? false);
        $this->keywords = self::list($data['keywords'] ?? [], 'Mots-clés', false);
        $this->status = $status;
        $this->statusMessage = $status === 'available' ? '' : $statusMessage;
        $this->returnAt = $returnAt;
        $this->alternative = $status === 'available' ? '' : self::text($data['alternative'] ?? '', 2000, 'Alternative', false);
        $this->transport = $transport;
        $this->updatedAt = $now;
    }

    private static function text(mixed $value, int $max, string $label, bool $required = true): string
    {
        if (!is_string($value) || mb_strlen($value) > $max) {
            throw new DomainException(sprintf('%s : texte de %d caractères maximum.', $label, $max));
        }
        $value = trim($value);
        if ($required && $value === '') {
            throw new DomainException(sprintf('%s requis.', $label));
        }

        return $value;
    }

    /** @return list<string> */
    private static function list(mixed $values, string $label, bool $required = true): array
    {
        if (!is_array($values) || count($values) > 50) {
            throw new DomainException(sprintf('%s : 50 éléments maximum.', $label));
        }
        $items = array_values(array_filter(array_map(fn ($value) => self::text($value, 1000, $label, false), $values), fn ($item) => $item !== ''));
        if ($required && $items === []) {
            throw new DomainException(sprintf('%s : au moins un élément.', $label));
        }

        return $items;
    }

    private static function fold(string $value): string
    {
        return mb_strtolower(strtr($value, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i',
            'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'É' => 'E', 'È' => 'E', 'Ê' => 'E',
            'À' => 'A', 'Â' => 'A', 'Î' => 'I', 'Ô' => 'O', 'Û' => 'U', 'Ç' => 'C',
        ]));
    }
}
