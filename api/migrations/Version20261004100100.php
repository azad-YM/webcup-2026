<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261004100100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L23 (F75): group of requests linked as the same problem.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE citizen_service_requests ADD group_id VARCHAR(36) DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_SERVICE_REQUEST_GROUP ON citizen_service_requests (group_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_SERVICE_REQUEST_GROUP ON citizen_service_requests');
        $this->addSql('ALTER TABLE citizen_service_requests DROP group_id');
    }
}
