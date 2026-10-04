<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261004100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L23 (F80, F86, F79): request priority, category, district and medical emergency.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE citizen_service_requests'
            . ' ADD priority VARCHAR(10) DEFAULT \'normal\' NOT NULL,'
            . ' ADD priority_rank SMALLINT DEFAULT 2 NOT NULL,'
            . ' ADD priority_reason VARCHAR(255) DEFAULT NULL,'
            . ' ADD priority_source VARCHAR(10) DEFAULT \'auto\' NOT NULL,'
            . ' ADD category VARCHAR(30) DEFAULT \'other\' NOT NULL,'
            . ' ADD district VARCHAR(100) DEFAULT NULL,'
            . ' ADD medical_emergency TINYINT(1) DEFAULT 0 NOT NULL,'
            . ' ADD emergency_handled_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\','
            . ' ADD emergency_handled_by VARCHAR(36) DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_SERVICE_REQUEST_PRIORITY ON citizen_service_requests (priority_rank, created_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_SERVICE_REQUEST_PRIORITY ON citizen_service_requests');
        $this->addSql('ALTER TABLE citizen_service_requests DROP priority, DROP priority_rank, DROP priority_reason, DROP priority_source,'
            . ' DROP category, DROP district, DROP medical_emergency, DROP emergency_handled_at, DROP emergency_handled_by');
    }
}
