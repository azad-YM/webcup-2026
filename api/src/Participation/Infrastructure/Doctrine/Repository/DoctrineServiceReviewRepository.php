<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Participation\Application\Ports\Repository\ServiceReviewRepository;
use Participation\Domain\Entity\ServiceReview;

final readonly class DoctrineServiceReviewRepository implements ServiceReviewRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(ServiceReview $review): void
    {
        $this->manager->persist($review);
    }

    public function find(string $id): ?ServiceReview
    {
        return $this->manager->find(ServiceReview::class, $id);
    }

    public function findForPeriod(string $citizenId, string $serviceId, string $period): ?ServiceReview
    {
        return $this->manager->getRepository(ServiceReview::class)->findOneBy(['citizenId' => $citizenId, 'serviceId' => $serviceId, 'period' => $period]);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(ServiceReview::class)->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC']));
    }

    public function findQueue(?string $status, ?string $serviceId, int $limit): array
    {
        $criteria = array_filter(['status' => $status, 'serviceId' => $serviceId], static fn (?string $value): bool => $value !== null && $value !== '');

        return array_values($this->manager->getRepository(ServiceReview::class)->findBy($criteria, ['updatedAt' => 'DESC'], $limit));
    }

    public function ratings(?string $serviceId = null): array
    {
        $query = $this->manager->createQueryBuilder()
            ->select('r.serviceId AS serviceId, AVG(r.rating) AS average, COUNT(r.id) AS total')
            ->from(ServiceReview::class, 'r')
            ->groupBy('r.serviceId');
        if ($serviceId !== null) {
            $query->where('r.serviceId = :service')->setParameter('service', $serviceId);
        }
        $ratings = [];
        foreach ($query->getQuery()->getArrayResult() as $row) {
            $ratings[(string) $row['serviceId']] = ['average' => round((float) $row['average'], 1), 'count' => (int) $row['total']];
        }

        return $ratings;
    }

    public function eraseByCitizen(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(ServiceReview::class, 'r')->where('r.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
