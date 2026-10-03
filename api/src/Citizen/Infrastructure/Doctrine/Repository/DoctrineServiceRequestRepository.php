<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Domain\Entity\ServiceRequest;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineServiceRequestRepository implements ServiceRequestRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(ServiceRequest $request): void
    {
        $this->manager->persist($request);
        foreach ($request->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function findById(string $id): ?ServiceRequest
    {
        return $this->manager->find(ServiceRequest::class, $id);
    }

    public function findByReference(string $reference): ?ServiceRequest
    {
        return $this->manager->getRepository(ServiceRequest::class)->findOneBy(['reference' => $reference]);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(ServiceRequest::class)
            ->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC', 'reference' => 'DESC']));
    }

    public function findQueue(?string $status, int $offset, int $limit): array
    {
        return array_values($this->manager->getRepository(ServiceRequest::class)
            ->findBy($this->criteria($status), ['createdAt' => 'ASC', 'reference' => 'ASC'], $limit, $offset));
    }

    public function countByStatus(?string $status): int
    {
        return $this->manager->getRepository(ServiceRequest::class)->count($this->criteria($status));
    }

    public function findPublic(int $limit): array
    {
        return array_values($this->manager->createQueryBuilder()
            ->select('r')->from(ServiceRequest::class, 'r')
            ->where('r.isPublic = true')->andWhere('r.status NOT IN (:closed)')
            ->setParameter('closed', [ServiceRequest::RESOLVED, ServiceRequest::REJECTED])
            ->orderBy('r.createdAt', 'DESC')->setMaxResults($limit)
            ->getQuery()->getResult());
    }

    /** @return array<string, string> */
    private function criteria(?string $status): array
    {
        return $status === null ? [] : ['status' => $status];
    }
}
