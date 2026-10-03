<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003110100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'L10 (F39, F40): appointment slots opened by agents and citizen appointments with reminders.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE citizen_appointment_slots (id VARCHAR(36) NOT NULL, service_id VARCHAR(100) NOT NULL, service_name VARCHAR(200) NOT NULL, starts_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', duration_minutes INT NOT NULL, location VARCHAR(255) NOT NULL, instructions LONGTEXT NOT NULL, appointment_id VARCHAR(36) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', version INT DEFAULT 1 NOT NULL, INDEX IDX_APPOINTMENT_SLOT_START (starts_at), INDEX IDX_APPOINTMENT_SLOT_SERVICE (service_id, starts_at), UNIQUE INDEX UNIQ_APPOINTMENT_SLOT_BOOKING (appointment_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE citizen_appointments (id VARCHAR(36) NOT NULL, reference VARCHAR(20) NOT NULL, citizen_id VARCHAR(36) NOT NULL, slot_id VARCHAR(36) NOT NULL, service_id VARCHAR(100) NOT NULL, service_name VARCHAR(200) NOT NULL, starts_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', duration_minutes INT NOT NULL, location VARCHAR(255) NOT NULL, instructions LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', day_before_reminded_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', two_hours_reminded_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', version INT DEFAULT 1 NOT NULL, UNIQUE INDEX UNIQ_APPOINTMENT_REFERENCE (reference), INDEX IDX_APPOINTMENT_CITIZEN (citizen_id, starts_at), INDEX IDX_APPOINTMENT_STATUS_START (status, starts_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_appointments');
        $this->addSql('DROP TABLE citizen_appointment_slots');
    }
}
