<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L11 (F45, F46): location of the physical municipal services and emergency kind.
 * Places the existing catalogue on the demonstration map and adds the emergency services of Nova Terra
 * (hospital, emergency department, fire brigade, police, on-duty pharmacy).
 * The demonstration coordinates are placed around Saint-Denis (La Réunion), host of the contest.
 */
final class Version20261003123000 extends AbstractMigration
{
    /** id => [address, district, lat, lng] */
    private const LOCATIONS = [
        'etat-civil' => ['Hôtel de ville, place de la Fondation — guichet 1', 'Centre', -20.879000, 55.448500],
        'sante' => ['Centre médical, 4 allée de l’Aurore', 'Est', -20.885000, 55.460000],
        'voirie-eclairage' => ['Centre technique municipal, 2 rue des Ateliers, zone nord', 'Nord', -20.872000, 55.445000],
        'transports' => ['Gare centrale des navettes, avenue des Convois', 'Centre', -20.880000, 55.452000],
        'eau-energie' => ['Régie de l’eau et de l’énergie, 9 rue du Soleil, dôme est', 'Est', -20.882000, 55.465000],
        'logement' => ['Hôtel de ville, place de la Fondation — guichet 4', 'Centre', -20.879100, 55.448700],
        'education' => ['Maison de l’enfance, 15 rue des Pionniers', 'Ouest', -20.890000, 55.440000],
        'proprete-recyclage' => ['Centre de recyclage, chemin des Serres, zone sud', 'Sud', -20.900000, 55.450000],
    ];

    private const EMERGENCY_SERVICES = [
        [
            'id' => 'hopital-nova-terra', 'name' => 'Hôpital de Nova Terra', 'category' => 'sante-solidarite', 'emergency' => 'hospital',
            'summary' => 'Hôpital de la ville : consultations, hospitalisation, maternité et imagerie médicale.',
            'description' => 'L’hôpital de Nova Terra accueille les habitants pour les consultations de spécialistes, les hospitalisations, les accouchements et les examens. En cas d’urgence vitale, appelez le 15 ou le 112.',
            'actions' => ['Prendre rendez-vous avec un spécialiste', 'Préparer une hospitalisation', 'Rendre visite à un proche hospitalisé'],
            'contact' => ['place' => 'Hôpital de Nova Terra, 1 boulevard de l’Aurore', 'hours' => 'Ouvert 24 h / 24, 7 jours sur 7 ; visites de 12 h à 20 h', 'phone' => '01 00 00 15 00'],
            'keywords' => ['hôpital', 'santé', 'maternité', 'urgence', 'médecin', 'spécialiste'],
            'location' => ['Hôpital de Nova Terra, 1 boulevard de l’Aurore', 'Est', -20.887000, 55.463000],
        ],
        [
            'id' => 'urgences-hopital', 'name' => 'Urgences de l’hôpital', 'category' => 'sante-solidarite', 'emergency' => 'emergency',
            'summary' => 'Service des urgences ouvert jour et nuit pour les blessures et les malaises graves.',
            'description' => 'Les urgences de l’hôpital accueillent sans rendez-vous, jour et nuit. Si la personne ne peut pas se déplacer ou si sa vie est en danger, appelez le 15 (SAMU) ou le 112 : une équipe vient sur place.',
            'actions' => ['Se présenter aux urgences, sans rendez-vous', 'Appeler le 15 (SAMU) en cas d’urgence vitale'],
            'contact' => ['place' => 'Hôpital de Nova Terra — entrée des urgences, rue des Secours', 'hours' => '24 h / 24, 7 jours sur 7', 'phone' => '15'],
            'keywords' => ['urgences', 'urgence', 'samu', 'blessure', 'malaise', 'hôpital', '15'],
            'location' => ['Hôpital de Nova Terra — entrée des urgences, rue des Secours', 'Est', -20.887400, 55.463700],
        ],
        [
            'id' => 'pompiers', 'name' => 'Centre de secours (pompiers)', 'category' => 'cadre-de-vie', 'emergency' => 'fire',
            'summary' => 'Incendie, accident, fuite de gaz ou personne en danger : les pompiers interviennent jour et nuit.',
            'description' => 'Le centre de secours de Nova Terra intervient pour les incendies, les accidents, les fuites dans les dômes et les secours aux personnes. Appelez le 18 ou le 112.',
            'actions' => ['Appeler le 18 ou le 112 en cas d’incendie ou d’accident', 'Demander une visite de prévention'],
            'contact' => ['place' => 'Caserne du Port, quai des Navettes', 'hours' => 'Interventions 24 h / 24 ; accueil du public de 9 h à 17 h', 'phone' => '18'],
            'keywords' => ['pompiers', 'incendie', 'feu', 'accident', 'secours', '18'],
            'location' => ['Caserne du Port, quai des Navettes', 'Port', -20.875000, 55.435000],
        ],
        [
            'id' => 'police-municipale', 'name' => 'Poste de police', 'category' => 'cadre-de-vie', 'emergency' => 'police',
            'summary' => 'Agression, vol, danger immédiat : la police répond jour et nuit au 17.',
            'description' => 'Le poste de police de Nova Terra reçoit les plaintes et intervient en cas de danger. En urgence, appelez le 17 ou le 112.',
            'actions' => ['Appeler le 17 en cas de danger', 'Déposer plainte au poste', 'Signaler un objet perdu ou trouvé'],
            'contact' => ['place' => 'Poste de police, 3 place de la Fondation', 'hours' => '24 h / 24 ; accueil du public de 8 h à 20 h', 'phone' => '17'],
            'keywords' => ['police', 'plainte', 'vol', 'agression', 'sécurité', '17'],
            'location' => ['Poste de police, 3 place de la Fondation', 'Centre', -20.878500, 55.450000],
        ],
        [
            'id' => 'pharmacie-de-garde', 'name' => 'Pharmacie de garde', 'category' => 'sante-solidarite', 'emergency' => 'pharmacy',
            'summary' => 'Médicaments le soir, la nuit, le dimanche et les jours fériés.',
            'description' => 'La pharmacie de la Fondation assure la garde de Nova Terra. La nuit, sonnez au guichet de garde et présentez votre ordonnance.',
            'actions' => ['Obtenir un médicament en dehors des heures d’ouverture', 'Demander conseil à un pharmacien'],
            'contact' => ['place' => 'Pharmacie de la Fondation, 12 avenue des Pionniers', 'hours' => 'Tous les jours de 8 h à 22 h ; la nuit, sonner au guichet de garde', 'phone' => '01 00 00 32 37'],
            'keywords' => ['pharmacie', 'garde', 'médicament', 'ordonnance', 'nuit', 'dimanche'],
            'location' => ['Pharmacie de la Fondation, 12 avenue des Pionniers', 'Centre', -20.881000, 55.447000],
        ],
    ];

    public function getDescription(): string
    {
        return 'L11 (F45, F46): location and emergency kind of municipal services, demonstration emergency services.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service ADD location JSON DEFAULT NULL, ADD emergency VARCHAR(20) DEFAULT NULL');
        foreach (self::LOCATIONS as $id => $location) {
            $this->addSql('UPDATE municipal_service SET location = ? WHERE id = ?', [self::location($location), $id]);
        }
        $now = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        foreach (self::EMERGENCY_SERVICES as $s) {
            $this->addSql(
                'INSERT INTO municipal_service (id, name, category, summary, description, actions, contact, featured, keywords, status, status_message, return_at, alternative, transport, updated_at, location, emergency) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, \'available\', \'\', NULL, \'\', NULL, ?, ?, ?)',
                [$s['id'], $s['name'], $s['category'], $s['summary'], $s['description'], self::json($s['actions']), self::json($s['contact']), self::json($s['keywords']), $now, self::location($s['location']), $s['emergency']],
            );
        }
    }

    public function down(Schema $schema): void
    {
        foreach (self::EMERGENCY_SERVICES as $s) {
            $this->addSql('DELETE FROM municipal_service WHERE id = ?', [$s['id']]);
        }
        $this->addSql('ALTER TABLE municipal_service DROP location, DROP emergency');
    }

    /** @param array{0: string, 1: string, 2: float, 3: float} $location */
    private static function location(array $location): string
    {
        return self::json(['address' => $location[0], 'district' => $location[1], 'lat' => $location[2], 'lng' => $location[3]]);
    }

    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
