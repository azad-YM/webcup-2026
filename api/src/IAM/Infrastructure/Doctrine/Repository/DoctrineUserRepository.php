<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final readonly class DoctrineUserRepository implements IUserRepository
{
    public function __construct(private EntityManagerInterface $entityManager) {}
    public function findById(string $id): ?User { return $this->entityManager->find(User::class, $id); }
    public function findByIds(array $ids): array { return $ids === [] ? [] : $this->entityManager->getRepository(User::class)->findBy(['id' => array_values($ids)]); }
    public function save(User $user): void { $this->entityManager->persist($user); }
    public function findByEmail(string $email): ?User { return $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]); }
}
