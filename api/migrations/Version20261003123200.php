<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L21 (F71): resident identifier and first-login obligation of accounts created at the city reception. */
final class Version20261003123200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L21 (F71): resident identifier (NT-XXXX-XXXX) and password_change_required on IAM accounts.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE auth_users ADD resident_id VARCHAR(12) DEFAULT NULL, ADD password_change_required TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D8A1F49C8012C5B0 ON auth_users (resident_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_D8A1F49C8012C5B0 ON auth_users');
        $this->addSql('ALTER TABLE auth_users DROP resident_id, DROP password_change_required');
    }
}
