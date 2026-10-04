<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L26 (F73) : message officiel du Haut Conseil = alerte de catégorie `official`, avec son signataire. */
final class Version20261004130100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Communication: alert category (standard, official) and signatory (F73).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE communication_alert ADD category VARCHAR(20) DEFAULT 'standard' NOT NULL, ADD signatory VARCHAR(160) DEFAULT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE communication_alert DROP category, DROP signatory');
    }
}
