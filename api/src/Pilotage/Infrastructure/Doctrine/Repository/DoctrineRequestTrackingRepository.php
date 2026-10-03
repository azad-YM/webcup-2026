<?php

declare(strict_types=1);

namespace Pilotage\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Pilotage\Domain\Entity\RequestTracking;

final readonly class DoctrineRequestTrackingRepository implements RequestTrackingRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function find(string $requestCode): ?RequestTracking
    {
        return $this->manager->find(RequestTracking::class, $requestCode);
    }

    public function all(): array
    {
        $all = [];
        foreach ($this->manager->getRepository(RequestTracking::class)->findAll() as $tracking) {
            $all[$tracking->requestCode] = $tracking;
        }

        return $all;
    }

    public function save(RequestTracking $tracking): void
    {
        $this->manager->persist($tracking);
    }
}
