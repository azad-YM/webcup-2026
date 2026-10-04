<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003110300 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L14 (F51): citizen concerns with acknowledgement, handling trail and agent answer.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizen_concerns (id VARCHAR(36) NOT NULL, reference VARCHAR(20) NOT NULL, citizen_id VARCHAR(36) NOT NULL, topic VARCHAR(20) NOT NULL, subject VARCHAR(160) NOT NULL, message LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, response LONGTEXT DEFAULT NULL, trail JSON NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_CONCERN_CITIZEN (citizen_id, created_at), INDEX IDX_CONCERN_STATUS (status, created_at), UNIQUE INDEX UNIQ_CONCERN_REFERENCE (reference), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_concerns');
    }
}
