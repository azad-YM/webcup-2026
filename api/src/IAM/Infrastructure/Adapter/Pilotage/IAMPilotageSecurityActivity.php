<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Activity\AccountSecurityActivity;
use Pilotage\Application\Ports\Provider\Activity\AccountSecurityActivityProvider;

/** Port of the Pilotage dashboard implemented by IAM: counts on its own tables only. */
final readonly class IAMPilotageSecurityActivity implements AccountSecurityActivityProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function accountSecurityActivity(\DateTimeImmutable $since): AccountSecurityActivity
    {
        $db = $this->manager->getConnection();

        return new AccountSecurityActivity(
            (int) $db->fetchOne("SELECT COUNT(*) FROM auth_users WHERE status = 'suspended'"),
            (int) $db->fetchOne('SELECT COUNT(*) FROM iam_login_security_events WHERE occurred_at >= ?', [$since->format('Y-m-d H:i:s')]),
        );
    }
}
