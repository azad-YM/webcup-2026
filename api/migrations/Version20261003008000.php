<?php

declare(strict_types=1);
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;
final class Version20261003008000 extends AbstractMigration
{
    public function getDescription(): string { return 'L8 account lifecycle, session revocation and shared login attempt counters.'; }
    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE auth_users ADD status VARCHAR(16) NOT NULL DEFAULT 'active', ADD session_version INT NOT NULL DEFAULT 0");
        $this->addSql("ALTER TABLE citizens ADD status VARCHAR(16) NOT NULL DEFAULT 'active'");
        $this->addSql('CREATE TABLE iam_login_attempt_buckets (id VARCHAR(64) NOT NULL, attempts INT NOT NULL, expires_at INT NOT NULL, INDEX IDX_LOGIN_BUCKET_EXPIRY (expires_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }
    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Removing account status would reactivate suspended and deleted accounts.');
    }
}
