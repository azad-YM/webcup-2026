<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Repository;

use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Domain\Entity\Citizen;

final class RamCitizenRepository implements CitizenRepository
{
    /** @var array<string, Citizen> */
    private array $citizens = [];
    /** @var list<\Shared\Domain\Event\DomainEvent> */
    public array $events = [];
    public int $saves = 0;

    public function findById(string $id): ?Citizen { foreach ($this->citizens as $citizen) if ($citizen->id === $id) return $citizen; return null; }
    public function findAccounts(): array { return array_values(array_filter($this->citizens, fn(Citizen $c) => $c->status() !== 'deleted')); }
    public function save(Citizen $citizen): void
    {
        $this->citizens[$citizen->userId] = $citizen;
        $this->saves++;
        array_push($this->events, ...$citizen->pullDomainEvents());
    }

    public function findByUserId(string $userId): ?Citizen { return $this->citizens[$userId] ?? null; }
}
