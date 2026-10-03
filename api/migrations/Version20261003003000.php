<?php
namespace DoctrineMigrations;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;
final class Version20261003003000 extends AbstractMigration {
 public function getDescription(): string { return 'Municipal services, communications and explicit health alert preferences'; }
 public function up(Schema $schema): void {
  $this->addSql('CREATE TABLE municipal_services (id VARCHAR(80) NOT NULL, data JSON NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
  $this->addSql('CREATE TABLE communications (id VARCHAR(80) NOT NULL, data JSON NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
  $this->addSql('CREATE TABLE citizen_alert_preferences (citizen_id VARCHAR(36) NOT NULL, health_consent TINYINT(1) NOT NULL, PRIMARY KEY(citizen_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
 }
 public function down(Schema $schema): void { $this->addSql('DROP TABLE citizen_alert_preferences'); $this->addSql('DROP TABLE communications'); $this->addSql('DROP TABLE municipal_services'); }
}
