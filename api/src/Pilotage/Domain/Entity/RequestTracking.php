<?php

declare(strict_types=1);

namespace Pilotage\Domain\Entity;

use Shared\Domain\Exception\DomainException;

/** Team tracking of one contest request (`requestCode`): status, links to the screens that answer it, short note. */
class RequestTracking
{
    public const STATUSES = ['todo', 'in_progress', 'done'];
    public const MAX_LINKS = 10;
    public const MAX_NOTE = 500;

    /** @var list<array{label: string, url: string}> */
    private array $links = [];
    private string $status = 'todo';
    private string $note = '';
    private \DateTimeImmutable $updatedAt;
    private ?string $updatedById = null;
    private string $updatedByName = '';

    private function __construct(public readonly string $requestCode)
    {
    }

    public static function start(string $requestCode): self
    {
        $requestCode = trim($requestCode);
        if (!preg_match('/^[A-Za-z0-9_-]{1,20}$/', $requestCode)) {
            throw new DomainException('Code de demande invalide.');
        }

        return new self($requestCode);
    }

    /** @param list<array{label?: mixed, url?: mixed}> $links */
    public function update(string $status, array $links, string $note, \DateTimeImmutable $now, ?string $byId, string $byName): void
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new DomainException('Statut de suivi inconnu.');
        }
        if (count($links) > self::MAX_LINKS) {
            throw new DomainException(sprintf('%d liens au maximum.', self::MAX_LINKS));
        }
        $clean = [];
        foreach ($links as $link) {
            $label = trim((string) ($link['label'] ?? ''));
            $url = trim((string) ($link['url'] ?? ''));
            if ($label === '' || mb_strlen($label) > 80) {
                throw new DomainException('Chaque lien a un libellé de 1 à 80 caractères.');
            }
            $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
            if (strlen($url) > 500 || !in_array($scheme, ['http', 'https'], true) || filter_var($url, FILTER_VALIDATE_URL) === false) {
                throw new DomainException(sprintf('Lien « %s » : adresse http(s) invalide.', $label));
            }
            $clean[] = ['label' => $label, 'url' => $url];
        }
        $note = trim($note);
        if (mb_strlen($note) > self::MAX_NOTE) {
            throw new DomainException(sprintf('La note est limitée à %d caractères.', self::MAX_NOTE));
        }
        $this->status = $status;
        $this->links = $clean;
        $this->note = $note;
        $this->updatedAt = $now;
        $this->updatedById = $byId;
        $this->updatedByName = mb_substr(trim($byName) === '' ? 'Inconnu' : trim($byName), 0, 180);
    }

    public function status(): string
    {
        return $this->status;
    }

    /** @return array{requestCode: string, status: string, links: list<array{label: string, url: string}>, note: string, updatedAt: string, updatedBy: string} */
    public function view(): array
    {
        return [
            'requestCode' => $this->requestCode,
            'status' => $this->status,
            'links' => $this->links,
            'note' => $this->note,
            'updatedAt' => $this->updatedAt->format(\DateTimeInterface::ATOM),
            'updatedBy' => $this->updatedByName,
        ];
    }
}
