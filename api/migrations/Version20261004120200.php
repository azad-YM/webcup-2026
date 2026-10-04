<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** L25 (F85) : code par e-mail exigé après une activité suspecte (IAM). */
final class Version20261004120200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'IAM: auth_users.code_required_until (verification code required after suspicious activity, F85).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE auth_users ADD code_required_until DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE auth_users DROP code_required_until');
    }
}
