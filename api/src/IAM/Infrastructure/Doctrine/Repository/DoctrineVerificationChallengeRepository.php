<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\VerificationChallengeRepository;
use IAM\Domain\Entity\VerificationChallenge;

final readonly class DoctrineVerificationChallengeRepository implements VerificationChallengeRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(VerificationChallenge $challenge): void { $this->manager->persist($challenge); }

    public function find(string $idHash): ?VerificationChallenge { return $this->manager->find(VerificationChallenge::class, $idHash); }

    public function findForUser(string $userId, string $purpose): ?VerificationChallenge
    {
        return $this->manager->getRepository(VerificationChallenge::class)->findOneBy(['userId' => $userId, 'purpose' => $purpose]);
    }

    public function remove(VerificationChallenge $challenge): void { $this->manager->remove($challenge); }
}
