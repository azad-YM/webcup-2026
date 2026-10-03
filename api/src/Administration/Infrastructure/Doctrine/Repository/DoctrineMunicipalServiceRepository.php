<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Doctrine\Repository;

use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Domain\Entity\MunicipalService;
use Doctrine\ORM\EntityManagerInterface;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineMunicipalServiceRepository implements MunicipalServiceRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(MunicipalService $service): void
    {
        $this->manager->persist($service);
    }

    public function find(string $id): ?MunicipalService
    {
        return $this->manager->find(MunicipalService::class, $id);
    }

    public function all(): array
    {
        return $this->manager->getRepository(MunicipalService::class)->findBy([], ['name' => 'ASC']);
    }
}
