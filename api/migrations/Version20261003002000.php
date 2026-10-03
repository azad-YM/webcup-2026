<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003002000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Citizen: service requests (lot L2)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizen_service_requests (id VARCHAR(36) NOT NULL, citizen_id VARCHAR(36) NOT NULL, reference VARCHAR(20) NOT NULL, type VARCHAR(20) NOT NULL, service_id VARCHAR(100) DEFAULT NULL, subject VARCHAR(160) NOT NULL, description LONGTEXT NOT NULL, location VARCHAR(255) DEFAULT NULL, status VARCHAR(20) NOT NULL, steps JSON NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', version INT DEFAULT 1 NOT NULL, UNIQUE INDEX UNIQ_SERVICE_REQUEST_REFERENCE (reference), INDEX IDX_SERVICE_REQUEST_CITIZEN (citizen_id, created_at), INDEX IDX_SERVICE_REQUEST_STATUS (status, created_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_service_requests');
    }
}
