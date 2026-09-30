<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260930000100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial boilerplate schema: accounts, PKCE portal codes, roles, admin members, example items and Messenger queue.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE admin_members (id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, role_ids JSON NOT NULL, active TINYINT(1) NOT NULL, UNIQUE INDEX UNIQ_ADMIN_MEMBER_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE auth_users (id VARCHAR(36) NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(255) DEFAULT NULL, UNIQUE INDEX UNIQ_D8A1F49CE7927C74 (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE example_items (id VARCHAR(36) NOT NULL, name VARCHAR(120) NOT NULL, description LONGTEXT NOT NULL, status VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE iam_portal_login_codes (hash VARCHAR(64) NOT NULL, user_id VARCHAR(36) NOT NULL, email VARCHAR(255) NOT NULL, destination VARCHAR(32) NOT NULL, challenge VARCHAR(43) NOT NULL, session_hash VARCHAR(64) NOT NULL, expires_at INT NOT NULL, session_expires_at INT NOT NULL, PRIMARY KEY(hash)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE roles (id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, permissions JSON NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', available_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', delivered_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE admin_members');
        $this->addSql('DROP TABLE auth_users');
        $this->addSql('DROP TABLE example_items');
        $this->addSql('DROP TABLE iam_portal_login_codes');
        $this->addSql('DROP TABLE roles');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
