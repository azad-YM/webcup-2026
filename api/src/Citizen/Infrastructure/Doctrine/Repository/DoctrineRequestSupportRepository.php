<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Service\AccountDataEraser;
use Citizen\Domain\Entity\RequestSupport;
use Doctrine\ORM\EntityManagerInterface;

final readonly class DoctrineRequestSupportRepository implements RequestSupportRepository, AccountDataEraser
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(RequestSupport $support): void
    {
        $this->manager->persist($support);
    }

    public function remove(RequestSupport $support): void
    {
        $this->manager->remove($support);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(RequestSupport::class)->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC']));
    }

    public function find(string $requestId, string $citizenId): ?RequestSupport
    {
        return $this->manager->getRepository(RequestSupport::class)->findOneBy(['requestId' => $requestId, 'citizenId' => $citizenId]);
    }

    public function countByRequests(array $requestIds): array
    {
        if ($requestIds === []) {
            return [];
        }
        $rows = $this->manager->createQueryBuilder()
            ->select('s.requestId AS requestId, COUNT(s.id) AS total')->from(RequestSupport::class, 's')
            ->where('s.requestId IN (:ids)')->setParameter('ids', $requestIds)
            ->groupBy('s.requestId')
            ->getQuery()->getArrayResult();
        $counts = [];
        foreach ($rows as $row) {
            $counts[(string) $row['requestId']] = (int) $row['total'];
        }

        return $counts;
    }

    public function supportedBy(string $citizenId, array $requestIds): array
    {
        if ($requestIds === []) {
            return [];
        }

        return array_map(fn (RequestSupport $support) => $support->requestId, $this->manager->getRepository(RequestSupport::class)
            ->findBy(['citizenId' => $citizenId, 'requestId' => $requestIds]));
    }

    /** Suppression du compte : les soutiens donnés par le citoyen sont retirés. */
    public function erase(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(RequestSupport::class, 's')->where('s.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
