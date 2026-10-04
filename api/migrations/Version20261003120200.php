<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L20 (F69) : compteurs du limiteur de débit des points d'entrée sensibles (ADR 007). */
final class Version20261003120200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Shared: rate_limit_counter table (fixed-window rate limiter, hashed keys).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE rate_limit_counter (id VARCHAR(64) NOT NULL, rule VARCHAR(60) NOT NULL, hits INT NOT NULL, expires_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_RATE_LIMIT_EXPIRES (expires_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE rate_limit_counter');
    }
}
