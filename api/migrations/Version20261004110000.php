<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L22 (F89): plain-language version of municipal services and publications, validated by the agent who saves it. */
final class Version20261004110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L22 (F89): plain_language on municipal_service and communication_publication.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE municipal_service ADD plain_language VARCHAR(600) DEFAULT '' NOT NULL");
        $this->addSql("ALTER TABLE communication_publication ADD plain_language VARCHAR(600) DEFAULT '' NOT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE communication_publication DROP plain_language');
        $this->addSql('ALTER TABLE municipal_service DROP plain_language');
    }
}
