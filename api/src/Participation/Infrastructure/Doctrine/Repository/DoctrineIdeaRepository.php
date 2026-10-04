<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Domain\Entity\Idea;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineIdeaRepository implements IdeaRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(Idea $idea): void
    {
        $this->manager->persist($idea);
    }

    public function find(string $id): ?Idea
    {
        return $this->manager->find(Idea::class, $id);
    }

    public function findPublic(int $limit): array
    {
        return array_values($this->manager->getRepository(Idea::class)->findBy(['public' => true], ['createdAt' => 'DESC'], $limit));
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(Idea::class)->findBy(['citizenId' => $citizenId], ['createdAt' => 'DESC']));
    }

    public function findQueue(?string $status, int $limit): array
    {
        return array_values($this->manager->getRepository(Idea::class)
            ->findBy($status === null ? [] : ['status' => $status], ['createdAt' => 'ASC'], $limit));
    }

    public function eraseByCitizen(string $citizenId): void
    {
        $this->manager->createQueryBuilder()
            ->delete(Idea::class, 'i')->where('i.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
