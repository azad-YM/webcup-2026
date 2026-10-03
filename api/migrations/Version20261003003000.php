<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Lots L3, L7, L9: catalogue of municipal services (Administration), publications and alerts (Communication),
 * explicit consent to health alerts (Citizen). Seeds the initial catalogue and the first publications of the city,
 * which replaced the local demonstration content of the site.
 */
final class Version20261003003000 extends AbstractMigration
{
    private const SEED = <<<'JSON'
{
 "services": [
  {
   "id": "etat-civil",
   "name": "État civil et citoyenneté",
   "category": "demarches",
   "summary": "Actes de naissance, de mariage et de décès, recensement des nouveaux arrivants, listes électorales.",
   "description": "Le service de l’état civil enregistre les grands moments de la vie des habitants de Nova Terra et délivre les justificatifs officiels. Toute personne arrivée par un convoi doit se faire recenser dans le mois qui suit son arrivée.",
   "actions": [
    "Demander un acte de naissance, de mariage ou de décès",
    "Se faire recenser à l’arrivée sur Nova Terra",
    "S’inscrire sur les listes électorales",
    "Préparer un mariage ou un pacte civil"
   ],
   "contact": {
    "place": "Hôtel de ville, dôme central — guichet 1",
    "hours": "Du lundi au vendredi, 8 h 30 – 17 h",
    "phone": "01 00 00 10 10"
   },
   "featured": true,
   "keywords": [
    "acte",
    "naissance",
    "mariage",
    "décès",
    "recensement",
    "arrivée",
    "élections",
    "papiers",
    "identité"
   ],
   "transport": null
  },
  {
   "id": "sante",
   "name": "Santé",
   "category": "sante-solidarite",
   "summary": "Centre médical, téléconsultation, vaccinations et prévention face aux rayonnements.",
   "description": "Le centre médical municipal assure les soins courants et les urgences. Une téléconsultation est disponible jour et nuit, et des bilans de prévention liés aux rayonnements et à la faible gravité sont proposés à tous les habitants.",
   "actions": [
    "Prendre rendez-vous au centre médical",
    "Lancer une téléconsultation",
    "Consulter le calendrier des vaccinations",
    "Faire un bilan de prévention rayonnements"
   ],
   "contact": {
    "place": "Centre médical, quartier Aurore",
    "hours": "Tous les jours, 7 h – 21 h ; urgences 24 h / 24",
    "phone": "15"
   },
   "featured": true,
   "keywords": [
    "médecin",
    "soins",
    "urgence",
    "vaccin",
    "téléconsultation",
    "radiation",
    "rayonnement",
    "hôpital"
   ],
   "transport": null
  },
  {
   "id": "voirie-eclairage",
   "name": "Voirie et éclairage",
   "category": "cadre-de-vie",
   "summary": "Entretien des voies et des passerelles entre les dômes, éclairage public, signalisation.",
   "description": "Les équipes de voirie entretiennent les voies de circulation, les passerelles pressurisées qui relient les dômes et l’éclairage public, essentiel pendant les longues nuits de la planète.",
   "actions": [
    "Signaler un problème sur la voie publique (bientôt en ligne)",
    "Consulter les travaux en cours",
    "Demander une autorisation d’occupation de la voie"
   ],
   "contact": {
    "place": "Centre technique municipal, zone nord",
    "hours": "Du lundi au samedi, 7 h – 18 h",
    "phone": "01 00 00 20 20"
   },
   "featured": true,
   "keywords": [
    "route",
    "rue",
    "trottoir",
    "passerelle",
    "lampadaire",
    "lumière",
    "travaux",
    "signalement",
    "panne"
   ],
   "transport": null
  },
  {
   "id": "transports",
   "name": "Transports",
   "category": "mobilite",
   "summary": "Navettes entre les quartiers, rovers en libre-service, horaires et abonnements.",
   "description": "Le réseau de navettes relie les quartiers de Nova Terra toutes les dix minutes en journée. Des rovers électriques en libre-service permettent de rejoindre les serres et les zones d’exploitation.",
   "actions": [
    "Consulter les horaires des navettes",
    "Souscrire un abonnement mensuel",
    "Réserver un rover en libre-service"
   ],
   "contact": {
    "place": "Gare centrale des navettes",
    "hours": "Tous les jours, 6 h – 23 h",
    "phone": "01 00 00 30 30"
   },
   "featured": true,
   "keywords": [
    "navette",
    "bus",
    "rover",
    "horaire",
    "abonnement",
    "déplacement",
    "mobilité"
   ],
   "transport": {
    "route": "Ligne A : Dôme central — Port — Serres ; ligne B : Nord — Centre — Sud ; ligne C : Est — Centre — Ouest",
    "timetable": "Du lundi au samedi : toutes les 10 minutes de 6 h à 21 h, puis toutes les 20 minutes jusqu’à 23 h.\nDimanche et jours fériés : toutes les 20 minutes de 7 h à 22 h.",
    "information": "Navettes accessibles aux fauteuils roulants. Abonnement mensuel en gare centrale ; trajets gratuits pour les moins de 16 ans et les nouveaux arrivants pendant leur premier mois."
   }
  },
  {
   "id": "eau-energie",
   "name": "Eau et énergie",
   "category": "cadre-de-vie",
   "summary": "Distribution et recyclage de l’eau, réseau solaire, raccordements et abonnements.",
   "description": "La régie municipale produit l’eau potable par recyclage et extraction, et distribue l’électricité du réseau solaire. Elle gère les raccordements des logements et les abonnements.",
   "actions": [
    "Ouvrir ou transférer un abonnement",
    "Déclarer une fuite ou une coupure",
    "Suivre sa consommation"
   ],
   "contact": {
    "place": "Régie de l’eau et de l’énergie, dôme est",
    "hours": "Du lundi au vendredi, 8 h – 17 h ; astreinte 24 h / 24",
    "phone": "01 00 00 40 40"
   },
   "featured": false,
   "keywords": [
    "eau",
    "électricité",
    "énergie",
    "solaire",
    "fuite",
    "coupure",
    "facture",
    "abonnement"
   ],
   "transport": null
  },
  {
   "id": "logement",
   "name": "Logement",
   "category": "habitat",
   "summary": "Demande de logement en module habitable, aides au logement, attribution aux nouveaux arrivants.",
   "description": "Le service du logement attribue les modules habitables aux foyers, en priorité aux nouveaux arrivants et aux familles. Il accompagne aussi les demandes d’aide et de changement de logement.",
   "actions": [
    "Déposer une demande de logement",
    "Demander un changement de module",
    "Se renseigner sur les aides au logement"
   ],
   "contact": {
    "place": "Hôtel de ville, dôme central — guichet 4",
    "hours": "Du lundi au vendredi, 9 h – 16 h",
    "phone": "01 00 00 50 50"
   },
   "featured": false,
   "keywords": [
    "logement",
    "module",
    "habitat",
    "appartement",
    "aide",
    "loyer",
    "attribution"
   ],
   "transport": null
  },
  {
   "id": "education",
   "name": "Éducation et petite enfance",
   "category": "famille",
   "summary": "Crèches, écoles, restauration scolaire et activités périscolaires.",
   "description": "Nova Terra accueille les enfants de 3 mois à 16 ans dans ses crèches et ses écoles. Les inscriptions et la restauration scolaire, issue des serres de la ville, sont gérées par la mairie.",
   "actions": [
    "Inscrire un enfant à la crèche ou à l’école",
    "Réserver la restauration scolaire",
    "Découvrir les activités périscolaires"
   ],
   "contact": {
    "place": "Maison de l’enfance, quartier des Pionniers",
    "hours": "Du lundi au vendredi, 8 h – 18 h",
    "phone": "01 00 00 60 60"
   },
   "featured": false,
   "keywords": [
    "école",
    "crèche",
    "enfant",
    "cantine",
    "inscription",
    "périscolaire",
    "famille"
   ],
   "transport": null
  },
  {
   "id": "proprete-recyclage",
   "name": "Propreté et recyclage",
   "category": "cadre-de-vie",
   "summary": "Collecte et tri des déchets, compostage pour les serres, encombrants.",
   "description": "Sur Nova Terra, presque tout se recycle : les déchets organiques nourrissent les serres et les matériaux sont réemployés. Le service organise la collecte, le tri et l’enlèvement des encombrants.",
   "actions": [
    "Consulter les jours de collecte de son quartier",
    "Demander l’enlèvement d’un encombrant",
    "Obtenir un composteur"
   ],
   "contact": {
    "place": "Centre de recyclage, zone sud",
    "hours": "Du mardi au samedi, 8 h – 17 h",
    "phone": "01 00 00 70 70"
   },
   "featured": false,
   "keywords": [
    "déchets",
    "poubelle",
    "tri",
    "recyclage",
    "compost",
    "encombrant",
    "collecte",
    "propreté"
   ],
   "transport": null
  }
 ],
 "publications": [
  {
   "id": "centre-sante-aurore",
   "title": "Le centre médical du quartier Aurore étend ses horaires",
   "category": "Santé",
   "summary": "À partir du 6 octobre, le centre médical accueille les habitants tous les jours de 7 h à 21 h, sans rendez-vous le matin.",
   "body": [
    "Pour répondre à l’arrivée des nouveaux habitants, le centre médical du quartier Aurore étend ses horaires d’ouverture à partir du lundi 6 octobre : il sera ouvert tous les jours, de 7 h à 21 h.",
    "Les consultations sont sans rendez-vous le matin. L’après-midi est réservé aux rendez-vous et aux bilans de prévention liés aux rayonnements. Les urgences restent assurées 24 h / 24.",
    "La téléconsultation reste disponible jour et nuit depuis la page du service Santé."
   ],
   "publishedAt": "2026-10-02T09:00:00+00:00"
  },
  {
   "id": "travaux-avenue-pionniers",
   "title": "Travaux d’éclairage sur l’avenue des Pionniers",
   "category": "Travaux",
   "summary": "Le remplacement des lampadaires de l’avenue des Pionniers aura lieu du 7 au 11 octobre. La circulation des navettes est maintenue.",
   "body": [
    "Les équipes de la voirie remplacent les lampadaires de l’avenue des Pionniers par un éclairage plus économe, adapté aux longues nuits de la planète.",
    "Les travaux se dérouleront du 7 au 11 octobre, de 8 h à 17 h. La circulation des navettes est maintenue ; les piétons sont invités à emprunter la passerelle couverte côté serres.",
    "Pour toute question, contactez le centre technique municipal."
   ],
   "publishedAt": "2026-09-29T14:00:00+00:00"
  },
  {
   "id": "accueil-nouveaux-arrivants",
   "title": "Bienvenue aux passagers du troisième convoi",
   "category": "Vie municipale",
   "summary": "Les nouveaux habitants arrivés par le troisième convoi sont attendus à l’hôtel de ville pour leur recensement et la remise de leur kit d’accueil.",
   "body": [
    "La ville de Nova Terra souhaite la bienvenue aux habitants arrivés par le troisième convoi. Un accueil spécial est organisé à l’hôtel de ville, dans le dôme central, jusqu’à la fin du mois.",
    "Sur place, le service de l’état civil procède au recensement et remet à chaque foyer son kit d’accueil : plan de la ville, horaires des navettes et informations de santé.",
    "Vous pouvez aussi créer dès maintenant votre compte citoyen sur ce site pour retrouver vos démarches dans votre espace personnel."
   ],
   "publishedAt": "2026-09-25T10:00:00+00:00"
  }
 ]
}
JSON;

    public function getDescription(): string
    {
        return 'Municipal services, publications and alerts, health alerts consent; initial content of the city.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE municipal_service (id VARCHAR(80) NOT NULL, name VARCHAR(200) NOT NULL, category VARCHAR(40) NOT NULL, summary LONGTEXT NOT NULL, description LONGTEXT NOT NULL, actions JSON NOT NULL, contact JSON NOT NULL, featured TINYINT(1) NOT NULL, keywords JSON NOT NULL, status VARCHAR(20) NOT NULL, status_message LONGTEXT NOT NULL, return_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', alternative LONGTEXT NOT NULL, transport JSON DEFAULT NULL, updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE communication_publication (id VARCHAR(80) NOT NULL, title VARCHAR(200) NOT NULL, category VARCHAR(80) NOT NULL, summary LONGTEXT NOT NULL, body JSON NOT NULL, important TINYINT(1) NOT NULL, state VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE communication_alert (id VARCHAR(80) NOT NULL, title VARCHAR(200) NOT NULL, message LONGTEXT NOT NULL, severity VARCHAR(20) NOT NULL, audience VARCHAR(20) NOT NULL, district VARCHAR(40) DEFAULT NULL, starts_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', ends_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', recommendations JSON NOT NULL, state VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE citizen_alert_preference (citizen_id VARCHAR(36) NOT NULL, health_consent TINYINT(1) NOT NULL, PRIMARY KEY(citizen_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $seed = json_decode(self::SEED, true, flags: JSON_THROW_ON_ERROR);
        $now = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        foreach ($seed['services'] as $s) {
            $this->addSql(
                'INSERT INTO municipal_service (id, name, category, summary, description, actions, contact, featured, keywords, status, status_message, return_at, alternative, transport, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'available\', \'\', NULL, \'\', ?, ?)',
                [$s['id'], $s['name'], $s['category'], $s['summary'], $s['description'], self::json($s['actions']), self::json($s['contact']), $s['featured'] ? 1 : 0, self::json($s['keywords']), $s['transport'] === null ? null : self::json($s['transport']), $now],
            );
        }
        foreach ($seed['publications'] as $p) {
            $publishedAt = (new \DateTimeImmutable($p['publishedAt']))->format('Y-m-d H:i:s');
            $this->addSql(
                'INSERT INTO communication_publication (id, title, category, summary, body, important, state, published_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, \'published\', ?, ?)',
                [$p['id'], $p['title'], $p['category'], $p['summary'], self::json($p['body']), $publishedAt, $publishedAt],
            );
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE citizen_alert_preference');
        $this->addSql('DROP TABLE communication_alert');
        $this->addSql('DROP TABLE communication_publication');
        $this->addSql('DROP TABLE municipal_service');
    }

    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
