<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L28 (F97) : lignes de transport municipal avec leur état et leurs solutions de remplacement.
 * Contenu initial : cinq lignes, dont deux interrompues et une perturbée, pour la démonstration.
 */
final class Version20261004140100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Administration: transport lines, status and replacement options (F97).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE transport_line (id VARCHAR(40) NOT NULL, code VARCHAR(10) NOT NULL, name VARCHAR(160) NOT NULL, mode VARCHAR(20) NOT NULL, stops JSON NOT NULL, districts JSON NOT NULL, frequency VARCHAR(200) NOT NULL, status VARCHAR(20) NOT NULL, status_message LONGTEXT NOT NULL, disrupted_since DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', return_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', replacements JSON NOT NULL, updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        foreach (self::lines() as $line) {
            $this->addSql(
                'INSERT INTO transport_line (id, code, name, mode, stops, districts, frequency, status, status_message, disrupted_since, return_at, replacements, updated_at)'
                .' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '.($line['since'] === null ? 'NULL' : sprintf('DATE_SUB(UTC_TIMESTAMP(), INTERVAL %d MINUTE)', $line['since'])).', '.($line['return'] === null ? 'NULL' : sprintf('DATE_ADD(UTC_TIMESTAMP(), INTERVAL %d HOUR)', $line['return'])).', ?, UTC_TIMESTAMP())',
                [$line['id'], $line['code'], $line['name'], $line['mode'], json_encode($line['stops'], JSON_UNESCAPED_UNICODE), json_encode($line['districts']), $line['frequency'], $line['status'], $line['message'], json_encode($line['replacements'], JSON_UNESCAPED_UNICODE)],
            );
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE transport_line');
    }

    /** @return list<array<string, mixed>> */
    private static function lines(): array
    {
        return [
            [
                'id' => 'ligne-1', 'code' => '1', 'name' => 'Navette Port ↔ Dôme des Pionniers', 'mode' => 'shuttle',
                'stops' => ['Port', 'Marché du Port', 'Hôtel de ville', 'Place Centrale', 'Dôme des Pionniers'],
                'districts' => ['Port', 'Centre', 'Nord'], 'frequency' => 'Toutes les 10 min, de 6 h à 22 h',
                'status' => 'interrupted', 'since' => 50, 'return' => 6,
                'message' => 'Ligne interrompue entre Hôtel de ville et Dôme des Pionniers : la voie a été endommagée par la tempête de poussière.',
                'replacements' => [
                    ['kind' => 'substitute-shuttle', 'label' => 'Navette de substitution 1S', 'details' => 'Toutes les 15 min devant l’arrêt Hôtel de ville (quai B) ; elle dessert Place Centrale et Dôme des Pionniers.', 'lineId' => null],
                    ['kind' => 'other-line', 'label' => 'Bus 3 jusqu’à Corniche, puis 5 min à pied', 'details' => 'Montez à l’arrêt Place Centrale ; descendez à Corniche, le Dôme des Pionniers est fléché.', 'lineId' => 'ligne-3'],
                ],
            ],
            [
                'id' => 'ligne-2', 'code' => '2', 'name' => 'Tram Serres du Sud ↔ Place Centrale', 'mode' => 'tram',
                'stops' => ['Serres du Sud', 'École du Sud', 'Hôpital', 'Place Centrale'],
                'districts' => ['Sud', 'Centre'], 'frequency' => 'Toutes les 8 min, de 5 h 30 à 23 h',
                'status' => 'normal', 'since' => null, 'return' => null, 'message' => '', 'replacements' => [],
            ],
            [
                'id' => 'ligne-3', 'code' => '3', 'name' => 'Bus Quartier Est ↔ École du Nord', 'mode' => 'bus',
                'stops' => ['Quartier Est', 'Centre sportif', 'Place Centrale', 'Corniche', 'École du Nord'],
                'districts' => ['Est', 'Centre', 'Nord'], 'frequency' => 'Toutes les 12 min, de 6 h à 21 h',
                'status' => 'disrupted', 'since' => 90, 'return' => 3,
                'message' => 'Retards de 10 à 15 minutes : déviation par la rue des Forges, l’arrêt Centre sportif est déplacé de 100 m.',
                'replacements' => [],
            ],
            [
                'id' => 'ligne-4', 'code' => '4', 'name' => 'Téléphérique Gare Ouest ↔ Hôtel de ville', 'mode' => 'cable',
                'stops' => ['Gare Ouest', 'Belvédère', 'Hôtel de ville'],
                'districts' => ['Ouest', 'Centre'], 'frequency' => 'En continu, de 7 h à 20 h',
                'status' => 'interrupted', 'since' => 30, 'return' => 24,
                'message' => 'Téléphérique arrêté pour une inspection de sécurité des câbles.',
                'replacements' => [
                    ['kind' => 'on-demand', 'label' => 'Transport à la demande gratuit', 'details' => 'Réservez au 0262 40 12 12 ou à l’accueil de la mairie, 30 min à l’avance. Véhicule adapté aux fauteuils roulants.', 'lineId' => null],
                    ['kind' => 'bike', 'label' => 'Vélos électriques en libre-service', 'details' => 'Stations devant Gare Ouest et Hôtel de ville : 30 min gratuites avec le code TELEPHERIQUE.', 'lineId' => null],
                ],
            ],
            [
                'id' => 'ligne-5', 'code' => 'N', 'name' => 'Rover de nuit', 'mode' => 'rover',
                'stops' => ['Place Centrale', 'Port', 'Quartier Est', 'Serres du Sud'],
                'districts' => ['Centre', 'Port', 'Est', 'Sud'], 'frequency' => 'Toutes les 30 min, de 22 h à 6 h',
                'status' => 'normal', 'since' => null, 'return' => null, 'message' => '', 'replacements' => [],
            ],
        ];
    }
}
