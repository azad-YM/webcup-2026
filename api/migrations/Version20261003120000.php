<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L18 (F63) : désactivation d'urgence d'un service municipal et permission `admin.service.disable`. */
final class Version20261003120000 extends AbstractMigration
{
    /** Permission given to the reference roles (also resynchronized by app:admin:bootstrap). */
    private const ROLE_PERMISSIONS = [
        'principal-administrator' => [['admin', 'service', 'disable']],
        'municipal-agent' => [['admin', 'service', 'disable']],
    ];

    public function getDescription(): string
    {
        return 'Administration: emergency disabling of a municipal service (disabled, reason, date) and permission admin.service.disable.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE municipal_service ADD disabled TINYINT(1) DEFAULT 0 NOT NULL, ADD disabled_reason VARCHAR(500) DEFAULT '' NOT NULL, ADD disabled_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)'");
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
        $this->addSql('ALTER TABLE municipal_service DROP disabled, DROP disabled_reason, DROP disabled_at');
    }
}
