<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'F49: citizen notifications (request status changes, appointment reminders, concern answers).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizen_notifications (id VARCHAR(36) NOT NULL, citizen_id VARCHAR(36) NOT NULL, kind VARCHAR(40) NOT NULL, source_key VARCHAR(120) NOT NULL, title VARCHAR(160) NOT NULL, message VARCHAR(1000) NOT NULL, link VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', read_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CITIZEN_NOTIFICATION_LIST (citizen_id, created_at), UNIQUE INDEX UNIQ_CITIZEN_NOTIFICATION_SOURCE (citizen_id, source_key), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_notifications');
    }
}
