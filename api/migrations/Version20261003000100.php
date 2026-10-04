<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003000100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove the Example template BC: drop example_items.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE example_items');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE example_items (id VARCHAR(36) NOT NULL, name VARCHAR(120) NOT NULL, description LONGTEXT NOT NULL, status VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }
}
