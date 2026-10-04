<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261004100200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L23 (F84): messages between agents and citizens on a request.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizen_request_messages (id VARCHAR(36) NOT NULL, request_id VARCHAR(36) NOT NULL, citizen_id VARCHAR(36) NOT NULL, author VARCHAR(10) NOT NULL, author_user_id VARCHAR(36) DEFAULT NULL, body LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_REQUEST_MESSAGE_REQUEST (request_id, created_at), INDEX IDX_REQUEST_MESSAGE_CITIZEN (citizen_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_request_messages');
    }
}
