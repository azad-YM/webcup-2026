<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Shared;

use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Shared\Application\Ports\Provider\OperationsAccessPolicy;

/** F87 : l'écran « Sauvegardes » est réservé aux membres actifs ayant `admin.backup.read` (administrateur principal). */
final readonly class AdminOperationsAccessPolicy implements OperationsAccessPolicy
{
    public const BACKUP_PERMISSION = 'admin.backup.read';

    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function canReadBackups(): bool
    {
        return ($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::BACKUP_PERMISSION]));
    }
}
