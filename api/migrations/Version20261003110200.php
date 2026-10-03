<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003110200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L14 (F52): public reports and citizen supports.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE citizen_service_requests ADD is_public TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('CREATE TABLE citizen_request_supports (id VARCHAR(36) NOT NULL, request_id VARCHAR(36) NOT NULL, citizen_id VARCHAR(36) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REQUEST_SUPPORT_CITIZEN (citizen_id), UNIQUE INDEX UNIQ_REQUEST_SUPPORT (request_id, citizen_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_request_supports');
        $this->addSql('ALTER TABLE citizen_service_requests DROP is_public');
    }
}
