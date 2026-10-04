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

    public function findQueue(?string $status, int $offset, int $limit, ?string $priority = null): array
    {
        return array_values($this->manager->getRepository(ServiceRequest::class)
            ->findBy($this->criteria($status, $priority), ['priorityRank' => 'ASC', 'createdAt' => 'ASC', 'reference' => 'ASC'], $limit, $offset));
    }

    public function countByStatus(?string $status, ?string $priority = null): int
    {
        return $this->manager->getRepository(ServiceRequest::class)->count($this->criteria($status, $priority));
    }

    public function countOpenByPriority(string $priority): int
    {
        return (int) $this->open()->select('COUNT(r.id)')
            ->andWhere('r.priority = :priority')->setParameter('priority', $priority)
            ->getQuery()->getSingleScalarResult();
    }

    public function findUnhandledEmergencies(int $limit): array
    {
        return array_values($this->open()
            ->andWhere('r.medicalEmergency = true')->andWhere('r.emergencyHandledAt IS NULL')
            ->orderBy('r.createdAt', 'ASC')->setMaxResults($limit)
            ->getQuery()->getResult());
    }

    public function findOpenSince(\DateTimeImmutable $since, int $limit): array
    {
        return array_values($this->open()
            ->andWhere('r.createdAt >= :since')->setParameter('since', $since)
            ->orderBy('r.createdAt', 'DESC')->setMaxResults($limit)
            ->getQuery()->getResult());
    }

    public function findByGroup(string $groupId): array
    {
        return array_values($this->manager->getRepository(ServiceRequest::class)
            ->findBy(['groupId' => $groupId], ['createdAt' => 'ASC']));
    }

    public function findByIds(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return array_values($this->manager->getRepository(ServiceRequest::class)->findBy(['id' => array_values($ids)]));
    }

    public function findOpenAutoPrioritized(int $limit): array
    {
        return array_values($this->open()
            ->andWhere('r.prioritySource = :auto')->setParameter('auto', ServiceRequest::PRIORITY_AUTO)
            ->orderBy('r.createdAt', 'ASC')->setMaxResults($limit)
            ->getQuery()->getResult());
    }

    private function open(): \Doctrine\ORM\QueryBuilder
    {
        return $this->manager->createQueryBuilder()
            ->select('r')->from(ServiceRequest::class, 'r')
            ->where('r.status NOT IN (:closed)')
            ->setParameter('closed', [ServiceRequest::RESOLVED, ServiceRequest::REJECTED]);
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
    private function criteria(?string $status, ?string $priority = null): array
    {
        return array_filter(['status' => $status, 'priority' => $priority], fn (?string $value) => $value !== null);
    }
}
