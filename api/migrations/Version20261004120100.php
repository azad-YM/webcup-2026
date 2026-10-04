<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L25 (F85) : anomalies détectées (Audit). */
final class Version20261004120100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Audit: audit_anomalies (unusual activity and inconsistent data, F85).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE audit_anomalies (id VARCHAR(36) NOT NULL, fingerprint VARCHAR(64) NOT NULL, rule VARCHAR(60) NOT NULL, category VARCHAR(20) NOT NULL, severity VARCHAR(10) NOT NULL, title VARCHAR(200) NOT NULL, explanation LONGTEXT NOT NULL, related JSON NOT NULL, status VARCHAR(10) DEFAULT 'new' NOT NULL, occurrences INT DEFAULT 1 NOT NULL, reaction VARCHAR(500) DEFAULT NULL, handled_by VARCHAR(180) DEFAULT NULL, handled_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', detected_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', last_seen_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', UNIQUE INDEX UNIQ_AUDIT_ANOMALY_FINGERPRINT (fingerprint), INDEX IDX_AUDIT_ANOMALY_STATUS (status, last_seen_at), INDEX IDX_AUDIT_ANOMALY_SEEN (last_seen_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE audit_anomalies');
    }
}
