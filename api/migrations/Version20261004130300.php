<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L26 (F74) : associations partenaires de démonstration dans le catalogue d'Administration (catégorie `partenaires`),
 * avec adresse, coordonnées, contact et horaires structurés (`contact.openingHours`, jour 1 = lundi).
 */
final class Version20261004130300 extends AbstractMigration
{
    private const PARTNERS = [
        [
            'id' => 'association-entraide-aurore', 'name' => 'Entraide de l’Aurore',
            'summary' => 'Aide alimentaire, vestiaire solidaire et accompagnement des familles en difficulté.',
            'description' => 'L’association Entraide de l’Aurore distribue des colis alimentaires, tient un vestiaire solidaire et aide les familles dans leurs démarches. L’accueil est libre et gratuit, sans rendez-vous.',
            'actions' => ['Recevoir un colis alimentaire', 'Trouver des vêtements au vestiaire solidaire', 'Être accompagné dans une démarche administrative'],
            'contact' => [
                'place' => 'Maison des associations, 12 rue des Pionniers', 'hours' => 'Lundi, mercredi et vendredi de 9 h à 12 h et de 14 h à 18 h ; samedi de 9 h à 12 h',
                'phone' => '01 00 00 20 10', 'person' => 'Mme Ravaka Andria, coordinatrice', 'email' => 'contact@entraide-aurore.example',
                'openingHours' => [
                    ['day' => 1, 'opens' => '09:00', 'closes' => '12:00'], ['day' => 1, 'opens' => '14:00', 'closes' => '18:00'],
                    ['day' => 3, 'opens' => '09:00', 'closes' => '12:00'], ['day' => 3, 'opens' => '14:00', 'closes' => '18:00'],
                    ['day' => 5, 'opens' => '09:00', 'closes' => '12:00'], ['day' => 5, 'opens' => '14:00', 'closes' => '18:00'],
                    ['day' => 6, 'opens' => '09:00', 'closes' => '12:00'],
                ],
            ],
            'keywords' => ['association', 'aide alimentaire', 'solidarité', 'vêtements', 'familles'],
            'location' => ['address' => 'Maison des associations, 12 rue des Pionniers', 'district' => 'Ouest', 'lat' => -20.889500, 'lng' => 55.441200],
        ],
        [
            'id' => 'association-jardins-partages', 'name' => 'Les Jardins partagés de Nova Terra',
            'summary' => 'Jardins collectifs sous serre, ateliers de culture et de compostage pour tous.',
            'description' => 'Les Jardins partagés proposent des parcelles cultivées ensemble sous les serres du quartier sud, des ateliers pour apprendre à cultiver et à composter, et des échanges de graines. Ouvert à tous les habitants, débutants bienvenus.',
            'actions' => ['Cultiver une parcelle partagée', 'Participer à un atelier de compostage', 'Échanger des graines'],
            'contact' => [
                'place' => 'Serres du quartier sud, chemin des Serres', 'hours' => 'Du mardi au samedi de 8 h à 17 h',
                'phone' => '01 00 00 20 20', 'person' => 'M. Tiago Mendes, animateur', 'email' => 'bonjour@jardins-partages.example', 'website' => 'https://jardins-partages.example',
                'openingHours' => [
                    ['day' => 2, 'opens' => '08:00', 'closes' => '17:00'], ['day' => 3, 'opens' => '08:00', 'closes' => '17:00'],
                    ['day' => 4, 'opens' => '08:00', 'closes' => '17:00'], ['day' => 5, 'opens' => '08:00', 'closes' => '17:00'],
                    ['day' => 6, 'opens' => '08:00', 'closes' => '17:00'],
                ],
            ],
            'keywords' => ['association', 'jardin', 'serre', 'compost', 'environnement'],
            'location' => ['address' => 'Serres du quartier sud, chemin des Serres', 'district' => 'Sud', 'lat' => -20.898500, 'lng' => 55.451500],
        ],
        [
            'id' => 'association-lire-ensemble', 'name' => 'Lire ensemble',
            'summary' => 'Aide aux devoirs, ateliers d’écriture et accompagnement à la lecture du français.',
            'description' => 'Lire ensemble accompagne les enfants pour les devoirs et les adultes qui veulent mieux lire et écrire le français, notamment les nouveaux arrivants. Des bénévoles reçoivent sur place, en petits groupes.',
            'actions' => ['Faire accompagner un enfant pour les devoirs', 'Apprendre à lire et écrire le français', 'Devenir bénévole'],
            'contact' => [
                'place' => 'Médiathèque centrale, 3 place de la Fondation', 'hours' => 'Du lundi au vendredi de 16 h à 19 h ; samedi de 10 h à 13 h',
                'phone' => '01 00 00 20 30', 'person' => 'Mme Amina Benali, présidente', 'email' => 'lire-ensemble@example.org',
                'openingHours' => [
                    ['day' => 1, 'opens' => '16:00', 'closes' => '19:00'], ['day' => 2, 'opens' => '16:00', 'closes' => '19:00'],
                    ['day' => 3, 'opens' => '16:00', 'closes' => '19:00'], ['day' => 4, 'opens' => '16:00', 'closes' => '19:00'],
                    ['day' => 5, 'opens' => '16:00', 'closes' => '19:00'], ['day' => 6, 'opens' => '10:00', 'closes' => '13:00'],
                ],
            ],
            'keywords' => ['association', 'lecture', 'devoirs', 'français', 'nouveaux arrivants'],
            'location' => ['address' => 'Médiathèque centrale, 3 place de la Fondation', 'district' => 'Centre', 'lat' => -20.878600, 'lng' => 55.449300],
        ],
    ];

    public function getDescription(): string
    {
        return 'Administration: demonstration partner associations in the service catalogue (F74).';
    }

    public function up(Schema $schema): void
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        foreach (self::PARTNERS as $p) {
            $this->addSql(
                'INSERT IGNORE INTO municipal_service (id, name, category, summary, description, actions, contact, featured, keywords, status, status_message, return_at, alternative, transport, updated_at, location, emergency) VALUES (?, ?, \'partenaires\', ?, ?, ?, ?, 0, ?, \'available\', \'\', NULL, \'\', NULL, ?, ?, NULL)',
                [$p['id'], $p['name'], $p['summary'], $p['description'], self::json($p['actions']), self::json($p['contact']), self::json($p['keywords']), $now, self::json($p['location'])],
            );
        }
    }

    public function down(Schema $schema): void
    {
        foreach (self::PARTNERS as $p) {
            $this->addSql('DELETE FROM municipal_service WHERE id = ?', [$p['id']]);
        }
    }

    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
