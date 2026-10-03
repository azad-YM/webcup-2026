<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003001100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Citizen BC: create citizens (one citizen per IAM account).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizens (id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, registered_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', first_name VARCHAR(100) DEFAULT NULL, last_name VARCHAR(100) DEFAULT NULL, phone VARCHAR(30) DEFAULT NULL, address VARCHAR(255) DEFAULT NULL, district VARCHAR(100) DEFAULT NULL, preferred_language VARCHAR(5) DEFAULT NULL, UNIQUE INDEX UNIQ_CITIZEN_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizens');
    }
}
