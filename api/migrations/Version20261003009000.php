<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003009000 extends AbstractMigration
{
    /** Initial tracking, taken from doc/chantier/demandes.md (🟡/⚠️ → in_progress, ✅ → done, ⬜ → todo). */
    private const INITIAL_TRACKING = [
        'D01' => 'in_progress',
        'D03' => 'in_progress',
        'D04' => 'in_progress',
        'D05' => 'in_progress',
        'D06' => 'in_progress',
        'D07' => 'in_progress',
        'D08' => 'in_progress',
        'D09' => 'done',
        'D19' => 'in_progress',
        'F22' => 'in_progress',
        'F21' => 'in_progress',
        'F23' => 'todo',
        'F24' => 'todo',
        'D11' => 'in_progress',
        'D12' => 'in_progress',
        'D14' => 'todo',
        'D15' => 'in_progress',
        'D16' => 'in_progress',
        'D17' => 'in_progress',
        'F25' => 'in_progress',
        'F26' => 'in_progress',
        'F27' => 'todo',
        'F28' => 'in_progress',
        'D18' => 'in_progress',
        'F29' => 'in_progress',
        'F30' => 'in_progress',
        'F31' => 'in_progress',
        'F32' => 'in_progress',
        'F33' => 'in_progress',
        'F34' => 'in_progress',
        'F35' => 'todo',
        'F36' => 'in_progress',
        'F37' => 'in_progress',
        'F38' => 'in_progress',
        'F39' => 'todo',
        'F40' => 'todo',
        'D13' => 'todo',
        'D20' => 'todo',
        'F41' => 'todo',
        'F42' => 'todo',
        'F43' => 'todo',
        'F44' => 'todo',
        'F45' => 'todo',
        'F46' => 'todo',
        'F47' => 'in_progress',
        'F48' => 'in_progress',
        'F49' => 'todo',
        'F50' => 'in_progress',
        'F51' => 'todo',
        'F52' => 'todo',
    ];

    /** Permissions added to the reference roles (also resynchronized by app:bootstrap-admin). */
    private const ROLE_PERMISSIONS = [
        'principal-administrator' => [['admin', 'pilotage', 'write'], ['admin', 'audit', 'read']],
        'municipal-agent' => [['admin', 'audit', 'read']],
    ];

    public function getDescription(): string
    {
        return 'Pilotage: tracking of the Webcup requests (pre-filled); Audit: action journal; permissions admin.pilotage.write and admin.audit.read.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE pilotage_request_tracking (request_code VARCHAR(20) NOT NULL, status VARCHAR(16) DEFAULT 'todo' NOT NULL, links JSON NOT NULL, note VARCHAR(500) DEFAULT '' NOT NULL, updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_by_id VARCHAR(36) DEFAULT NULL, updated_by_name VARCHAR(180) NOT NULL, PRIMARY KEY(request_code)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE audit_entries (id VARCHAR(36) NOT NULL, occurred_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', actor_id VARCHAR(36) DEFAULT NULL, actor_label VARCHAR(180) NOT NULL, action VARCHAR(80) NOT NULL, category VARCHAR(40) NOT NULL, target_type VARCHAR(40) NOT NULL, target_id VARCHAR(120) DEFAULT NULL, summary VARCHAR(255) NOT NULL, details JSON NOT NULL, INDEX IDX_AUDIT_OCCURRED (occurred_at), INDEX IDX_AUDIT_ACTION (action, occurred_at), INDEX IDX_AUDIT_ACTOR (actor_id, occurred_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        foreach (self::INITIAL_TRACKING as $code => $status) {
            $this->addSql(
                "INSERT IGNORE INTO pilotage_request_tracking (request_code, status, links, note, updated_at, updated_by_id, updated_by_name) VALUES (?, ?, '[]', 'Pré-rempli depuis le registre du chantier.', UTC_TIMESTAMP(), NULL, 'Registre du chantier')",
                [$code, $status],
            );
        }
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
        $this->addSql('DROP TABLE audit_entries');
        $this->addSql('DROP TABLE pilotage_request_tracking');
    }
}
