<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003121000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L15 (IAM): sign-in link (D02), e-mail verification code (F53), known devices and sign-in history (F54).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE auth_users ADD email_verification TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('CREATE TABLE iam_known_devices (id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, device_hash VARCHAR(64) NOT NULL, label VARCHAR(80) NOT NULL, first_seen_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', last_used_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', trusted_until DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_IAM_DEVICE_USER_HASH (user_id, device_hash), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE iam_sign_ins (id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, device_id VARCHAR(36) DEFAULT NULL, device_label VARCHAR(80) NOT NULL, method VARCHAR(16) NOT NULL, second_factor TINYINT(1) NOT NULL, ip VARCHAR(45) NOT NULL, occurred_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_IAM_SIGN_IN_USER (user_id, occurred_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE iam_login_links (token_hash VARCHAR(64) NOT NULL, user_id VARCHAR(36) NOT NULL, browser_hash VARCHAR(64) NOT NULL, created_at INT NOT NULL, expires_at INT NOT NULL, INDEX IDX_IAM_LOGIN_LINK_USER (user_id, created_at), PRIMARY KEY(token_hash)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE iam_verification_challenges (id_hash VARCHAR(64) NOT NULL, user_id VARCHAR(36) NOT NULL, purpose VARCHAR(16) NOT NULL, code_hash VARCHAR(64) NOT NULL, attempts INT DEFAULT 0 NOT NULL, sends INT DEFAULT 1 NOT NULL, last_sent_at INT NOT NULL, expires_at INT NOT NULL, method VARCHAR(16) DEFAULT NULL, device_hash VARCHAR(64) DEFAULT NULL, INDEX IDX_IAM_CHALLENGE_USER (user_id), PRIMARY KEY(id_hash)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE iam_verification_challenges');
        $this->addSql('DROP TABLE iam_login_links');
        $this->addSql('DROP TABLE iam_sign_ins');
        $this->addSql('DROP TABLE iam_known_devices');
        $this->addSql('ALTER TABLE auth_users DROP email_verification');
    }
}
