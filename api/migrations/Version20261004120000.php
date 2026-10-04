<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L25 (F81, F82, F85) : signaux d'abus et clés d'idempotence (Shared, ADR 012). */
final class Version20261004120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Shared: abuse_signals (429 and form guard refusals) and idempotency_keys (replayed submissions).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE abuse_signals (id BIGINT AUTO_INCREMENT NOT NULL, kind VARCHAR(30) NOT NULL, rule VARCHAR(60) NOT NULL, client VARCHAR(16) NOT NULL, occurred_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_ABUSE_SIGNAL_OCCURRED (occurred_at), INDEX IDX_ABUSE_SIGNAL_KIND (kind, occurred_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("CREATE TABLE idempotency_keys (id VARCHAR(64) NOT NULL, request_hash VARCHAR(64) NOT NULL, state VARCHAR(10) DEFAULT 'pending' NOT NULL, status_code SMALLINT DEFAULT NULL, body LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', expires_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_IDEMPOTENCY_EXPIRES (expires_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE abuse_signals');
        $this->addSql('DROP TABLE idempotency_keys');
    }
}
