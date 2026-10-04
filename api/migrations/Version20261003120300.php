<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;
use Shared\Infrastructure\Doctrine\EncryptedStringType;

/**
 * L20 (F69) : chiffrement au repos du téléphone et de l'adresse des citoyens (ADR 007).
 * La clé est celle du kernel (`DATA_ENCRYPTION_KEY`, sinon dérivée de `APP_SECRET`) : lancer la migration avec
 * la même configuration que l'application. `down` déchiffre puis rétablit les colonnes d'origine.
 */
final class Version20261003120300 extends AbstractMigration
{
    private const COLUMNS = ['phone', 'address'];

    public function getDescription(): string
    {
        return 'Citizen: encrypt phone and address at rest (encrypted_string, libsodium secretbox).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE citizens CHANGE phone phone VARCHAR(255) DEFAULT NULL COMMENT '(DC2Type:encrypted_string)', CHANGE address address VARCHAR(1024) DEFAULT NULL COMMENT '(DC2Type:encrypted_string)'");
        foreach ($this->connection->fetchAllAssociative('SELECT id, phone, address FROM citizens WHERE phone IS NOT NULL OR address IS NOT NULL') as $row) {
            foreach (self::COLUMNS as $column) {
                $value = $row[$column];
                if ($value !== null && !EncryptedStringType::isEncrypted($value)) {
                    $this->addSql(sprintf('UPDATE citizens SET %s = ? WHERE id = ?', $column), [EncryptedStringType::encrypt((string) $value), $row['id']]);
                }
            }
        }
    }

    public function down(Schema $schema): void
    {
        foreach ($this->connection->fetchAllAssociative('SELECT id, phone, address FROM citizens WHERE phone IS NOT NULL OR address IS NOT NULL') as $row) {
            foreach (self::COLUMNS as $column) {
                $value = $row[$column];
                if (EncryptedStringType::isEncrypted($value)) {
                    $this->addSql(sprintf('UPDATE citizens SET %s = ? WHERE id = ?', $column), [EncryptedStringType::decrypt((string) $value), $row['id']]);
                }
            }
        }
        $this->addSql('ALTER TABLE citizens CHANGE phone phone VARCHAR(30) DEFAULT NULL, CHANGE address address VARCHAR(255) DEFAULT NULL');
    }
}
