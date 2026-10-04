<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L19 (F65, F66, F67, F68) — BC Participation (ADR 008): projects, consultations and calls for opinions,
 * contributions of the citizens, ideas box; permissions admin.participation.read / write for the reference roles.
 */
final class Version20261003122000 extends AbstractMigration
{
    /** Permissions added to the reference roles (also resynchronized by app:bootstrap-admin). */
    private const ROLE_PERMISSIONS = [
        'principal-administrator' => [['admin', 'participation', 'read'], ['admin', 'participation', 'write']],
        'municipal-agent' => [['admin', 'participation', 'read'], ['admin', 'participation', 'write']],
    ];

    public function getDescription(): string
    {
        return 'L19: Participation BC (projects, consultations, contributions, ideas) and permissions admin.participation.read/write.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE participation_projects (id VARCHAR(36) NOT NULL, title VARCHAR(200) NOT NULL, summary LONGTEXT NOT NULL, description JSON NOT NULL, district VARCHAR(40) DEFAULT NULL, status VARCHAR(20) NOT NULL, steps JSON NOT NULL, next_step VARCHAR(500) DEFAULT NULL, state VARCHAR(20) DEFAULT 'draft' NOT NULL, published_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_PARTICIPATION_PROJECT_STATE (state, updated_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE participation_consultations (id VARCHAR(36) NOT NULL, project_id VARCHAR(36) DEFAULT NULL, kind VARCHAR(20) NOT NULL, title VARCHAR(200) NOT NULL, question LONGTEXT NOT NULL, description JSON NOT NULL, options JSON NOT NULL, opens_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', closes_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', state VARCHAR(20) DEFAULT 'draft' NOT NULL, published_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', outcome JSON NOT NULL, outcome_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_PARTICIPATION_CONSULTATION_PROJECT (project_id), INDEX IDX_PARTICIPATION_CONSULTATION_STATE (state, closes_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE participation_contributions (id VARCHAR(36) NOT NULL, reference VARCHAR(20) NOT NULL, consultation_id VARCHAR(36) NOT NULL, citizen_id VARCHAR(36) NOT NULL, choice VARCHAR(20) DEFAULT NULL, rating VARCHAR(20) DEFAULT NULL, comment LONGTEXT DEFAULT NULL, revisions INT DEFAULT 0 NOT NULL, submitted_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_PARTICIPATION_CONTRIBUTION_CITIZEN (citizen_id, submitted_at), UNIQUE INDEX UNIQ_PARTICIPATION_CONTRIBUTION (consultation_id, citizen_id), UNIQUE INDEX UNIQ_PARTICIPATION_CONTRIBUTION_REFERENCE (reference), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE participation_ideas (id VARCHAR(36) NOT NULL, reference VARCHAR(20) NOT NULL, citizen_id VARCHAR(36) NOT NULL, title VARCHAR(160) NOT NULL, description LONGTEXT NOT NULL, district VARCHAR(40) DEFAULT NULL, status VARCHAR(20) DEFAULT 'received' NOT NULL, status_comment LONGTEXT DEFAULT NULL, is_public TINYINT(1) DEFAULT 1 NOT NULL, hidden_reason LONGTEXT DEFAULT NULL, trail JSON NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_PARTICIPATION_IDEA_CITIZEN (citizen_id, created_at), INDEX IDX_PARTICIPATION_IDEA_STATUS (status, created_at), UNIQUE INDEX UNIQ_PARTICIPATION_IDEA_REFERENCE (reference), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
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
        $this->addSql('DROP TABLE participation_ideas');
        $this->addSql('DROP TABLE participation_contributions');
        $this->addSql('DROP TABLE participation_consultations');
        $this->addSql('DROP TABLE participation_projects');
    }
}
