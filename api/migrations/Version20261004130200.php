<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L26 (F76) : avis des habitants sur les services municipaux (Participation). */
final class Version20261004130200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Participation: service reviews, one per citizen, service and month (F76).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE participation_service_reviews (
            id VARCHAR(36) NOT NULL,
            reference VARCHAR(20) NOT NULL,
            citizen_id VARCHAR(36) NOT NULL,
            service_id VARCHAR(100) NOT NULL,
            service_name VARCHAR(200) NOT NULL,
            period VARCHAR(7) NOT NULL,
            rating SMALLINT NOT NULL,
            need_met VARCHAR(10) NOT NULL,
            comment LONGTEXT DEFAULT NULL,
            context VARCHAR(20) DEFAULT 'service' NOT NULL,
            context_reference VARCHAR(40) DEFAULT NULL,
            status VARCHAR(20) DEFAULT 'received' NOT NULL,
            response LONGTEXT DEFAULT NULL,
            responded_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
            created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
            updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
            INDEX IDX_PARTICIPATION_REVIEW_CITIZEN (citizen_id, created_at),
            INDEX IDX_PARTICIPATION_REVIEW_SERVICE (service_id),
            INDEX IDX_PARTICIPATION_REVIEW_STATUS (status, updated_at),
            UNIQUE INDEX UNIQ_PARTICIPATION_REVIEW_REFERENCE (reference),
            UNIQUE INDEX UNIQ_PARTICIPATION_REVIEW_PERIOD (citizen_id, service_id, period),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE participation_service_reviews');
    }
}
