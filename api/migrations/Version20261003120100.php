<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L20 (F70) : permission `admin.sensitive-data.read` (données personnelles sensibles), donnée au seul administrateur principal. */
final class Version20261003120100 extends AbstractMigration
{
    /** Permission given to the reference roles (also resynchronized by app:admin:bootstrap). */
    private const ROLE_PERMISSIONS = [
        'principal-administrator' => [['admin', 'sensitive-data', 'read']],
    ];

    public function getDescription(): string
    {
        return 'Administration: permission admin.sensitive-data.read for the principal administrator (F70).';
    }

    public function up(Schema $schema): void
    {
        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            foreach ($permissions as [$context, $resource, $action]) {
                $this->addSql(
                    "UPDATE roles SET permissions = JSON_ARRAY_APPEND(permissions, '$', JSON_OBJECT('context', ?, 'resource', ?, 'action', ?)) WHERE id = ? AND NOT JSON_CONTAINS(permissions, JSON_OBJECT('context', ?, 'resource', ?, 'action', ?))",
                    [$context, $resource, $action, $role, $context, $resource, $action],
                );
            }
        }
    }

    public function down(Schema $schema): void
    {
        foreach (self::ROLE_PERMISSIONS as $role => $permissions) {
            foreach ($permissions as [$context, $resource, $action]) {
                $this->addSql(
                    "UPDATE roles SET permissions = COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('context', jt.c, 'resource', jt.r, 'action', jt.a)) FROM JSON_TABLE(roles.permissions, '$[*]' COLUMNS(c VARCHAR(64) PATH '$.context', r VARCHAR(64) PATH '$.resource', a VARCHAR(64) PATH '$.action')) AS jt WHERE NOT (jt.c = ? AND jt.r = ? AND jt.a = ?)), JSON_ARRAY()) WHERE id = ?",
                    [$context, $resource, $action, $role],
                );
            }
        }
    }
}
