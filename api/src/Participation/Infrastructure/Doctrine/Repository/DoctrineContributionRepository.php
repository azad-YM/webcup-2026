<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Domain\Entity\Contribution;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineContributionRepository implements ContributionRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(Contribution $contribution): void
    {
        $this->manager->persist($contribution);
    }

    public function findFor(string $consultationId, string $citizenId): ?Contribution
    {
        return $this->manager->getRepository(Contribution::class)->findOneBy(['consultationId' => $consultationId, 'citizenId' => $citizenId]);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(Contribution::class)->findBy(['citizenId' => $citizenId], ['submittedAt' => 'DESC']));
    }

    public function findByConsultation(string $consultationId): array
    {
        return array_values($this->manager->getRepository(Contribution::class)->findBy(['consultationId' => $consultationId], ['submittedAt' => 'ASC']));
    }

    public function countByConsultation(string $consultationId): int
    {
        return $this->manager->getRepository(Contribution::class)->count(['consultationId' => $consultationId]);
    }

    public function tally(array $consultationIds): array
    {
        $result = [];
        foreach ($consultationIds as $id) {
            $result[$id] = ['total' => 0, 'choices' => [], 'ratings' => [], 'comments' => 0];
        }
        if ($consultationIds === []) {
            return $result;
        }
        $rows = $this->manager->createQueryBuilder()
            ->select('c.consultationId AS consultation, c.choice AS choice, c.rating AS rating, COUNT(c.id) AS total, SUM(CASE WHEN c.comment IS NULL THEN 0 ELSE 1 END) AS comments')
            ->from(Contribution::class, 'c')
            ->where('c.consultationId IN (:ids)')->setParameter('ids', $consultationIds)
            ->groupBy('c.consultationId, c.choice, c.rating')
            ->getQuery()->getArrayResult();
        foreach ($rows as $row) {
            $id = (string) $row['consultation'];
            $count = (int) $row['total'];
            $result[$id]['total'] += $count;
            $result[$id]['comments'] += (int) $row['comments'];
            if ($row['choice'] !== null) {
                $result[$id]['choices'][(string) $row['choice']] = ($result[$id]['choices'][(string) $row['choice']] ?? 0) + $count;
            }
            if ($row['rating'] !== null) {
                $result[$id]['ratings'][(string) $row['rating']] = ($result[$id]['ratings'][(string) $row['rating']] ?? 0) + $count;
            }
        }

        return $result;
    }

    public function eraseByCitizen(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(Contribution::class, 'c')->where('c.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
