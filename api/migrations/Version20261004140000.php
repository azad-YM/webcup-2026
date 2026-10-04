<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L28 (F101, F104) : nature de l'événement d'une alerte (coupure d'électricité, tempête solaire…) et zone touchée en clair. */
final class Version20261004140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Communication: alert kind and affected area (F101, F104).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE communication_alert ADD kind VARCHAR(20) DEFAULT 'general' NOT NULL, ADD area VARCHAR(300) DEFAULT '' NOT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE communication_alert DROP kind, DROP area');
    }
}
