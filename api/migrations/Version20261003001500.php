<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003001500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Realtime: shared realtime_event buffer read by the SSE stream (transport database).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE realtime_event (id BIGINT AUTO_INCREMENT NOT NULL, topic VARCHAR(255) NOT NULL, type VARCHAR(100) NOT NULL, payload JSON NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REALTIME_EVENT_TOPIC_ID (topic, id), INDEX IDX_REALTIME_EVENT_CREATED_AT (created_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE realtime_event');
    }
}
