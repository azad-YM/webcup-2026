<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Doctrine\Repository;

use Administration\Application\Ports\Repository\TransportLineRepository;
use Administration\Domain\Entity\TransportLine;
use Doctrine\ORM\EntityManagerInterface;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineTransportLineRepository implements TransportLineRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(TransportLine $line): void
    {
        $this->manager->persist($line);
    }

    public function find(string $id): ?TransportLine
    {
        return $this->manager->find(TransportLine::class, $id);
    }

    public function all(): array
    {
        return $this->manager->getRepository(TransportLine::class)->findBy([], ['code' => 'ASC']);
    }
}
