<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Activity\AdministrationActivity;
use Pilotage\Application\Ports\Provider\Activity\AdministrationActivityProvider;

/** Port of the Pilotage dashboard implemented by Administration: counts on its own tables only. */
final readonly class AdminPilotageActivity implements AdministrationActivityProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function administrationActivity(): AdministrationActivity
    {
        $db = $this->manager->getConnection();
        $services = $db->fetchAssociative("SELECT COUNT(*) AS total, SUM(status IN ('maintenance', 'incident')) AS disrupted FROM municipal_service") ?: [];

        return new AdministrationActivity(
            (int) $db->fetchOne('SELECT COUNT(*) FROM admin_members WHERE active = 1'),
            (int) ($services['total'] ?? 0),
            (int) ($services['disrupted'] ?? 0),
        );
    }
}
