<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Service\AccountSessionRevoker;
final readonly class DoctrineAccountSessionRevoker implements AccountSessionRevoker
{
    public function __construct(private EntityManagerInterface $manager) {}
    public function revokePortalCodes(string $userId): void
    {
        $this->manager->getConnection()->executeStatement('DELETE FROM iam_portal_login_codes WHERE user_id = ?', [$userId]);
    }
}
