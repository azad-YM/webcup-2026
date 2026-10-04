<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\LoginLinkRepository;
use IAM\Domain\Entity\LoginLink;

final readonly class DoctrineLoginLinkRepository implements LoginLinkRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(LoginLink $link): void { $this->manager->persist($link); }

    public function find(string $tokenHash): ?LoginLink { return $this->manager->find(LoginLink::class, $tokenHash); }

    /** Suppression conditionnelle : deux ouvertures simultanées du même lien ne donnent qu'une session. */
    public function consume(LoginLink $link): bool
    {
        $deleted = $this->manager->getConnection()->executeStatement('DELETE FROM iam_login_links WHERE token_hash = ?', [$link->tokenHash]) === 1;
        $this->manager->detach($link);

        return $deleted;
    }

    public function countSince(string $userId, int $since): int
    {
        return (int) $this->manager->getConnection()->fetchOne('SELECT COUNT(*) FROM iam_login_links WHERE user_id = ? AND created_at >= ?', [$userId, $since]);
    }
}
