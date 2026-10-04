<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L24 (F78) : index des requêtes fréquentes (lectures publiques, analyse de sécurité). */
final class Version20261004120300 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Indexes for frequent reads: publications and alerts by state, sign-ins and new devices by date (F78, F85).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX IDX_COMMUNICATION_PUBLICATION_STATE ON communication_publication (state, published_at)');
        $this->addSql('CREATE INDEX IDX_COMMUNICATION_ALERT_STATE ON communication_alert (state, ends_at)');
        $this->addSql('CREATE INDEX IDX_IAM_SIGN_IN_OCCURRED ON iam_sign_ins (occurred_at)');
        $this->addSql('CREATE INDEX IDX_IAM_DEVICE_FIRST_SEEN ON iam_known_devices (first_seen_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_COMMUNICATION_PUBLICATION_STATE ON communication_publication');
        $this->addSql('DROP INDEX IDX_COMMUNICATION_ALERT_STATE ON communication_alert');
        $this->addSql('DROP INDEX IDX_IAM_SIGN_IN_OCCURRED ON iam_sign_ins');
        $this->addSql('DROP INDEX IDX_IAM_DEVICE_FIRST_SEEN ON iam_known_devices');
    }
}
