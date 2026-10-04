<?php

declare(strict_types=1);

namespace Demo;

/**
 * Jeu de données fictif de Nova Terra : textes et liens entre les acteurs, sans aucune logique.
 * Les identifiants des services sont stables (ils servent de clés publiques) ; tout le reste est créé
 * par les cas d'usage et relu dans leurs réponses.
 */
final class DemoDataset
{
    public const PASSWORD = 'password';

    /** Rôles créés par l'administrateur principal (le rôle « Administrateur principal » a déjà tout le catalogue). */
    public const ROLES = [
        'accueil' => ['name' => 'Agent d’accueil et demandes', 'permissions' => ['request.read', 'request.write', 'citizen.read', 'citizen.write', 'pilotage.read']],
        'communication' => ['name' => 'Chargé de communication et participation', 'permissions' => ['communication.write', 'participation.read', 'participation.write', 'pilotage.read']],
        'technique' => ['name' => 'Responsable des services techniques', 'permissions' => ['request.read', 'request.write', 'service.write', 'service.disable', 'pilotage.read', 'export.read', 'audit.read']],
    ];

    /** Agents : clé => [nom, préfixe e-mail, rôle]. */
    public const AGENTS = [
        'accueil' => ['Fatima Saïd', 'agent.accueil', 'accueil'],
        'communication' => ['Karim Abdallah', 'agent.communication', 'communication'],
        'technique' => ['Inès Mohamed', 'agent.technique', 'technique'],
    ];

    /** Citoyens : [prénom, nom, quartier, téléphone]. E-mail : citoyen01…citoyen20. */
    public const CITIZENS = [
        ['Amina', 'Ahmed', 'Centre', '+269 320 10 01'],
        ['Youssouf', 'Ali', 'Nord', '+269 320 10 02'],
        ['Zaïnaba', 'Mohamed', 'Port', '+269 320 10 03'],
        ['Ibrahim', 'Saïd', 'Sud', '+269 320 10 04'],
        ['Mariama', 'Abdou', 'Est', '+269 320 10 05'],
        ['Hamada', 'Moussa', 'Ouest', '+269 320 10 06'],
        ['Faïza', 'Bacar', 'Centre', '+269 320 10 07'],
        ['Soilihi', 'Madi', 'Port', '+269 320 10 08'],
        ['Nadia', 'Houmadi', 'Nord', '+269 320 10 09'],
        ['Djamal', 'Combo', 'Sud', '+269 320 10 10'],
        ['Hadidja', 'Mzé', 'Est', '+269 320 10 11'],
        ['Anrafa', 'Chanfi', 'Ouest', '+269 320 10 12'],
        ['Sitti', 'Hassani', 'Centre', '+269 320 10 13'],
        ['Omar', 'Attoumane', 'Port', '+269 320 10 14'],
        ['Rahma', 'Soulé', 'Nord', '+269 320 10 15'],
        ['Kassim', 'Daoud', 'Sud', '+269 320 10 16'],
        ['Echati', 'Ismaël', 'Est', '+269 320 10 17'],
        ['Mounir', 'Toybou', 'Ouest', '+269 320 10 18'],
        ['Salama', 'Youssouf', 'Centre', '+269 320 10 19'],
        ['Abdallah', 'Nassur', 'Port', '+269 320 10 20'],
    ];

    /** @return list<array<string, mixed>> payloads de SaveMunicipalServiceCommand */
    public static function services(): array
    {
        $hours = static fn (int $from, int $to, string $opens, string $closes): array => array_map(
            static fn (int $day) => ['day' => $day, 'opens' => $opens, 'closes' => $closes],
            range($from, $to),
        );

        return [
            [
                'id' => 'etat-civil', 'name' => 'État civil et citoyenneté', 'category' => 'demarches', 'featured' => true,
                'summary' => 'Actes de naissance, de mariage et de décès, recensement des nouveaux arrivants, listes électorales.',
                'description' => 'Le service de l’état civil enregistre les grands moments de la vie des habitants de Nova Terra et délivre les justificatifs officiels. Toute personne arrivée par un convoi doit se faire recenser dans le mois qui suit son arrivée.',
                'actions' => ['Demander un acte de naissance, de mariage ou de décès', 'Se faire recenser à l’arrivée sur Nova Terra', 'S’inscrire sur les listes électorales', 'Préparer un mariage ou un pacte civil'],
                'contact' => ['place' => 'Hôtel de ville, dôme central — guichet 1', 'hours' => 'Du lundi au vendredi, 8 h 30 – 17 h', 'phone' => '01 00 00 10 10', 'email' => 'etat-civil@nova-terra.example', 'openingHours' => $hours(1, 5, '08:30', '17:00')],
                'keywords' => ['acte', 'naissance', 'mariage', 'décès', 'recensement', 'arrivée', 'élections', 'papiers', 'identité'],
                'location' => ['address' => 'Place de l’Hôtel de ville, dôme central', 'district' => 'Centre', 'lat' => -11.7022, 'lng' => 43.2551],
                'plainLanguage' => 'Ici, vous demandez vos papiers officiels : naissance, mariage, décès. Si vous venez d’arriver, venez vous faire recenser dans le mois.',
            ],
            [
                'id' => 'sante', 'name' => 'Santé', 'category' => 'sante-solidarite', 'featured' => true,
                'summary' => 'Centre médical, téléconsultation, vaccinations et prévention face aux rayonnements.',
                'description' => 'Le centre médical municipal assure les soins courants et les urgences. Une téléconsultation est disponible jour et nuit, et des bilans de prévention liés aux rayonnements et à la faible gravité sont proposés à tous les habitants.',
                'actions' => ['Prendre rendez-vous au centre médical', 'Lancer une téléconsultation', 'Consulter le calendrier des vaccinations', 'Faire un bilan de prévention rayonnements'],
                'contact' => ['place' => 'Centre médical, quartier Aurore', 'hours' => 'Tous les jours, 7 h – 21 h ; urgences 24 h / 24', 'phone' => '15', 'openingHours' => $hours(1, 7, '07:00', '21:00')],
                'keywords' => ['médecin', 'soins', 'urgence', 'vaccin', 'téléconsultation', 'radiation', 'rayonnement', 'hôpital'],
                'location' => ['address' => 'Rue de l’Aurore, quartier Est', 'district' => 'Est', 'lat' => -11.6985, 'lng' => 43.2622],
            ],
            [
                'id' => 'voirie-eclairage', 'name' => 'Voirie et éclairage', 'category' => 'cadre-de-vie', 'featured' => true,
                'summary' => 'Entretien des voies et des passerelles entre les dômes, éclairage public, signalisation.',
                'description' => 'Les équipes de voirie entretiennent les voies de circulation, les passerelles pressurisées qui relient les dômes et l’éclairage public, essentiel pendant les longues nuits de la planète.',
                'actions' => ['Signaler un problème sur la voie publique', 'Consulter les travaux en cours', 'Demander une autorisation d’occupation de la voie'],
                'contact' => ['place' => 'Centre technique municipal, zone nord', 'hours' => 'Du lundi au samedi, 7 h – 18 h', 'phone' => '01 00 00 20 20', 'openingHours' => $hours(1, 6, '07:00', '18:00')],
                'keywords' => ['route', 'rue', 'trottoir', 'passerelle', 'lampadaire', 'lumière', 'travaux', 'signalement', 'panne', 'nid de poule'],
                'location' => ['address' => 'Centre technique, zone nord', 'district' => 'Nord', 'lat' => -11.6890, 'lng' => 43.2560],
            ],
            [
                'id' => 'transports', 'name' => 'Transports', 'category' => 'mobilite', 'featured' => true,
                'summary' => 'Navettes entre les quartiers, rovers en libre-service, horaires et abonnements.',
                'description' => 'Le réseau de navettes relie les quartiers de Nova Terra toutes les dix minutes en journée. Des rovers électriques en libre-service permettent de rejoindre les serres et les zones d’exploitation.',
                'actions' => ['Consulter les horaires des navettes', 'Souscrire un abonnement mensuel', 'Réserver un rover en libre-service'],
                'contact' => ['place' => 'Gare centrale des navettes', 'hours' => 'Tous les jours, 6 h – 23 h', 'phone' => '01 00 00 30 30'],
                'keywords' => ['navette', 'bus', 'rover', 'horaire', 'abonnement', 'déplacement', 'mobilité'],
                'transport' => ['route' => 'Ligne circulaire : Gare centrale → Port → Sud → Ouest → Nord → Est → Gare centrale', 'timetable' => 'Toutes les 10 minutes de 6 h à 21 h, puis toutes les 30 minutes jusqu’à 23 h.', 'information' => 'Navettes accessibles aux fauteuils roulants. Abonnement mensuel en vente à la gare centrale.'],
                'location' => ['address' => 'Gare centrale des navettes', 'district' => 'Centre', 'lat' => -11.7040, 'lng' => 43.2530],
            ],
            [
                'id' => 'eau-energie', 'name' => 'Eau et énergie', 'category' => 'cadre-de-vie',
                'summary' => 'Distribution et recyclage de l’eau, réseau solaire, raccordements et abonnements.',
                'description' => 'La régie municipale produit l’eau potable par recyclage et extraction, et distribue l’électricité du réseau solaire. Elle gère les raccordements des logements et les abonnements.',
                'actions' => ['Ouvrir ou transférer un abonnement', 'Déclarer une fuite ou une coupure', 'Suivre sa consommation'],
                'contact' => ['place' => 'Régie de l’eau et de l’énergie, dôme est', 'hours' => 'Du lundi au vendredi, 8 h – 17 h ; astreinte 24 h / 24', 'phone' => '01 00 00 40 40'],
                'keywords' => ['eau', 'électricité', 'énergie', 'solaire', 'fuite', 'coupure', 'facture', 'abonnement'],
                'status' => 'maintenance',
                'statusMessage' => 'Maintenance du réseau solaire du quartier Port : coupures d’électricité possibles de 9 h à 12 h.',
                'returnAt' => (new \DateTimeImmutable('+2 days 12:00'))->format(DATE_ATOM),
                'alternative' => 'Des bornes de recharge restent disponibles à la gare centrale des navettes.',
                'location' => ['address' => 'Dôme est', 'district' => 'Est', 'lat' => -11.6995, 'lng' => 43.2668],
            ],
            [
                'id' => 'logement', 'name' => 'Logement', 'category' => 'habitat',
                'summary' => 'Demande de logement en module habitable, aides au logement, attribution aux nouveaux arrivants.',
                'description' => 'Le service du logement attribue les modules habitables aux foyers, en priorité aux nouveaux arrivants et aux familles. Il accompagne aussi les demandes d’aide et de changement de logement.',
                'actions' => ['Déposer une demande de logement', 'Demander un changement de module', 'Se renseigner sur les aides au logement'],
                'contact' => ['place' => 'Hôtel de ville, dôme central — guichet 4', 'hours' => 'Du lundi au vendredi, 9 h – 16 h', 'phone' => '01 00 00 50 50'],
                'keywords' => ['logement', 'module', 'habitat', 'appartement', 'aide', 'loyer', 'attribution'],
                'location' => ['address' => 'Hôtel de ville, guichet 4', 'district' => 'Centre', 'lat' => -11.7025, 'lng' => 43.2556],
            ],
            [
                'id' => 'education', 'name' => 'Éducation et petite enfance', 'category' => 'famille',
                'summary' => 'Crèches, écoles, restauration scolaire et activités périscolaires.',
                'description' => 'Nova Terra accueille les enfants de 3 mois à 16 ans dans ses crèches et ses écoles. Les inscriptions et la restauration scolaire, issue des serres de la ville, sont gérées par la mairie.',
                'actions' => ['Inscrire un enfant à la crèche ou à l’école', 'Réserver la restauration scolaire', 'Découvrir les activités périscolaires'],
                'contact' => ['place' => 'Maison de l’enfance, quartier des Pionniers', 'hours' => 'Du lundi au vendredi, 8 h – 18 h', 'phone' => '01 00 00 60 60'],
                'keywords' => ['école', 'crèche', 'enfant', 'cantine', 'inscription', 'périscolaire', 'famille'],
                'location' => ['address' => 'Maison de l’enfance, avenue des Pionniers', 'district' => 'Ouest', 'lat' => -11.7060, 'lng' => 43.2470],
            ],
            [
                'id' => 'proprete-recyclage', 'name' => 'Propreté et recyclage', 'category' => 'cadre-de-vie',
                'summary' => 'Collecte et tri des déchets, compostage pour les serres, encombrants.',
                'description' => 'Sur Nova Terra, presque tout se recycle : les déchets organiques nourrissent les serres et les matériaux sont réemployés. Le service organise la collecte, le tri et l’enlèvement des encombrants.',
                'actions' => ['Consulter les jours de collecte de son quartier', 'Demander l’enlèvement d’un encombrant', 'Obtenir un composteur'],
                'contact' => ['place' => 'Centre de recyclage, zone sud', 'hours' => 'Du mardi au samedi, 8 h – 17 h', 'phone' => '01 00 00 70 70'],
                'keywords' => ['déchets', 'poubelle', 'tri', 'recyclage', 'compost', 'encombrant', 'collecte', 'propreté'],
                'location' => ['address' => 'Centre de recyclage, zone sud', 'district' => 'Sud', 'lat' => -11.7150, 'lng' => 43.2540],
            ],
            [
                'id' => 'hopital-central', 'name' => 'Hôpital central de Nova Terra', 'category' => 'sante-solidarite', 'emergency' => 'hospital',
                'summary' => 'Urgences, hospitalisation et maternité, ouvert jour et nuit.',
                'description' => 'L’hôpital central accueille les urgences vitales 24 h / 24, les hospitalisations et la maternité. En cas d’urgence, appelez le 15.',
                'actions' => ['Appeler le 15 en cas d’urgence', 'Préparer une hospitalisation', 'Visiter un proche hospitalisé'],
                'contact' => ['place' => 'Boulevard de la Station, quartier Est', 'hours' => '24 h / 24, 7 j / 7', 'phone' => '15'],
                'keywords' => ['hôpital', 'urgence', 'maternité', 'blessure', 'malaise'],
                'location' => ['address' => 'Boulevard de la Station', 'district' => 'Est', 'lat' => -11.6960, 'lng' => 43.2650],
            ],
            [
                'id' => 'pompiers', 'name' => 'Pompiers et secours', 'category' => 'sante-solidarite', 'emergency' => 'fire',
                'summary' => 'Incendies, dépressurisation d’un dôme, accidents : intervention immédiate.',
                'description' => 'La caserne des pompiers intervient sur les incendies, les fuites d’air des dômes et les accidents de rover.',
                'actions' => ['Appeler le 18', 'Demander un exercice d’évacuation pour un immeuble'],
                'contact' => ['place' => 'Caserne du Port', 'hours' => '24 h / 24, 7 j / 7', 'phone' => '18'],
                'keywords' => ['feu', 'incendie', 'fumée', 'dépressurisation', 'accident', 'secours'],
                'location' => ['address' => 'Quai des Convois', 'district' => 'Port', 'lat' => -11.7080, 'lng' => 43.2420],
            ],
            [
                'id' => 'police-municipale', 'name' => 'Police municipale', 'category' => 'demarches', 'emergency' => 'police',
                'summary' => 'Tranquillité publique, objets trouvés, stationnement des rovers.',
                'description' => 'La police municipale veille à la tranquillité des quartiers, gère les objets trouvés et le stationnement des rovers.',
                'actions' => ['Déclarer un objet perdu ou trouvé', 'Signaler un trouble de voisinage', 'Appeler le 17 en cas de danger'],
                'contact' => ['place' => 'Poste central, dôme central', 'hours' => '24 h / 24', 'phone' => '17'],
                'keywords' => ['police', 'vol', 'objet trouvé', 'bruit', 'voisinage', 'stationnement'],
                'location' => ['address' => 'Poste central, dôme central', 'district' => 'Centre', 'lat' => -11.7010, 'lng' => 43.2540],
            ],
            [
                'id' => 'pharmacie-du-port', 'name' => 'Pharmacie du Port', 'category' => 'sante-solidarite', 'emergency' => 'pharmacy',
                'summary' => 'Pharmacie de garde, médicaments et conseils de prévention.',
                'description' => 'La pharmacie du Port assure la garde de nuit et le week-end pour toute la ville.',
                'actions' => ['Retirer une ordonnance', 'Demander un conseil'],
                'contact' => ['place' => 'Rue des Marins, quartier Port', 'hours' => 'Tous les jours, 8 h – 22 h ; garde la nuit', 'phone' => '01 00 00 80 80', 'openingHours' => $hours(1, 7, '08:00', '22:00')],
                'keywords' => ['pharmacie', 'médicament', 'ordonnance', 'garde'],
                'location' => ['address' => 'Rue des Marins', 'district' => 'Port', 'lat' => -11.7095, 'lng' => 43.2445],
            ],
            [
                'id' => 'serres-partagees', 'name' => 'Association des serres partagées', 'category' => 'partenaires',
                'summary' => 'Jardins hydroponiques ouverts aux habitants, ateliers de culture et paniers solidaires.',
                'description' => 'L’association gère les serres partagées du quartier Sud : chaque foyer peut louer une parcelle hydroponique et participer aux ateliers du samedi.',
                'actions' => ['Réserver une parcelle', 'Participer à un atelier', 'Recevoir un panier solidaire'],
                'contact' => ['place' => 'Serres du Sud, allée 3', 'hours' => 'Du mercredi au dimanche, 9 h – 18 h', 'person' => 'Nassim Ben Ali', 'email' => 'contact@serres-nova.example', 'website' => 'https://serres-nova.example', 'openingHours' => $hours(3, 7, '09:00', '18:00')],
                'keywords' => ['serre', 'jardin', 'potager', 'culture', 'association', 'panier'],
                'location' => ['address' => 'Serres du Sud, allée 3', 'district' => 'Sud', 'lat' => -11.7180, 'lng' => 43.2510],
            ],
        ];
    }

    /** @return list<array<string, mixed>> payloads de SavePublicationCommand */
    public static function publications(): array
    {
        return [
            ['title' => 'Le centre médical du quartier Aurore étend ses horaires', 'category' => 'Santé', 'state' => 'published',
                'summary' => 'Le centre médical accueille désormais les habitants tous les jours de 7 h à 21 h, sans rendez-vous le matin.',
                'body' => ['Pour répondre à l’arrivée des nouveaux habitants, le centre médical du quartier Aurore étend ses horaires : il est ouvert tous les jours, de 7 h à 21 h.', 'Les consultations sont sans rendez-vous le matin. L’après-midi est réservé aux rendez-vous et aux bilans de prévention liés aux rayonnements.', 'La téléconsultation reste disponible jour et nuit depuis la page du service Santé.'],
                'plainLanguage' => 'Le centre médical est ouvert tous les jours de 7 h à 21 h. Le matin, venez sans rendez-vous.'],
            ['title' => 'Travaux d’éclairage sur l’avenue des Pionniers', 'category' => 'Travaux', 'state' => 'published',
                'summary' => 'Le remplacement des lampadaires de l’avenue des Pionniers a lieu cette semaine. La circulation des navettes est maintenue.',
                'body' => ['Les équipes de la voirie remplacent les lampadaires de l’avenue des Pionniers par un éclairage plus économe, adapté aux longues nuits de la planète.', 'Les travaux se déroulent de 8 h à 17 h. Les piétons sont invités à emprunter la passerelle couverte côté serres.']],
            ['title' => 'Bienvenue aux passagers du troisième convoi', 'category' => 'Vie municipale', 'state' => 'published', 'important' => true,
                'summary' => 'Les nouveaux habitants arrivés par le troisième convoi sont attendus à l’hôtel de ville pour leur recensement et leur kit d’accueil.',
                'body' => ['La ville de Nova Terra souhaite la bienvenue aux habitants arrivés par le troisième convoi. Un accueil spécial est organisé à l’hôtel de ville jusqu’à la fin du mois.', 'Sur place, l’état civil procède au recensement et remet à chaque foyer son kit d’accueil : plan de la ville, horaires des navettes et informations de santé.', 'Créez dès maintenant votre compte citoyen pour suivre vos démarches en ligne.']],
            ['title' => 'Nouveau : prenez rendez-vous en ligne avec l’état civil', 'category' => 'Démarches', 'state' => 'published',
                'summary' => 'Depuis votre espace citoyen, réservez un créneau au guichet de l’état civil et recevez un rappel la veille.',
                'body' => ['Fini l’attente au guichet : l’état civil ouvre ses créneaux de rendez-vous en ligne.', 'Connectez-vous à votre espace citoyen, choisissez « Rendez-vous », puis le créneau qui vous convient. Un rappel vous est envoyé la veille et deux heures avant.']],
            ['title' => 'Semaine du tri : les serres ont besoin de vos déchets organiques', 'category' => 'Environnement', 'state' => 'published',
                'summary' => 'Du lundi au samedi, des ateliers de tri et de compostage sont proposés dans chaque quartier.',
                'body' => ['Le compost des habitants nourrit directement les serres de la ville. Pendant la semaine du tri, des agents vous attendent dans chaque quartier pour vous expliquer les bons gestes.', 'Un composteur est offert aux 200 premiers foyers inscrits auprès du service Propreté et recyclage.']],
            ['title' => 'Budget participatif 2027 : préparez vos idées', 'category' => 'Participation', 'state' => 'draft',
                'summary' => 'Le prochain budget participatif ouvrira bientôt. Commencez à réfléchir aux projets de votre quartier.',
                'body' => ['Brouillon : calendrier et règlement à confirmer par le conseil municipal.']],
        ];
    }

    /**
     * Demandes : [citoyen, type, service, sujet, description, lieu, public, urgence médicale, traitement].
     * Traitement : ['agent' => clé, 'steps' => [[statut, commentaire]], 'reply' => texte, 'priority' => [niveau, raison]].
     *
     * @return list<array<int, mixed>>
     */
    public static function requests(): array
    {
        return [
            [0, 'report', 'voirie-eclairage', 'Lampadaire éteint devant l’école', 'Le lampadaire devant l’école des Pionniers ne s’allume plus depuis trois soirs. Les enfants sortent dans le noir.', 'Avenue des Pionniers, devant l’école', true, false,
                ['agent' => 'technique', 'steps' => [['acknowledged', 'Signalement transmis à l’équipe éclairage.'], ['in_progress', 'Intervention prévue demain matin.']], 'priority' => ['high', 'Sécurité des enfants à la sortie de l’école.']]],
            [1, 'report', 'voirie-eclairage', 'Nid-de-poule dangereux sur la voie nord', 'Un trou d’environ 40 cm s’est formé sur la voie principale du quartier Nord. Deux rovers ont déjà crevé.', 'Voie principale, quartier Nord, près de l’arrêt de navette', true, false,
                ['agent' => 'technique', 'steps' => [['in_progress', 'Balisage posé, rebouchage programmé.'], ['resolved', 'La chaussée a été réparée. Merci pour votre signalement.']]]],
            [2, 'report', 'proprete-recyclage', 'Conteneurs de tri débordants au port', 'Les conteneurs de tri du quai des Convois débordent depuis le week-end, les déchets s’envolent.', 'Quai des Convois', true, false,
                ['agent' => 'accueil', 'steps' => [['acknowledged', 'Collecte supplémentaire demandée au centre de recyclage.']]]],
            [3, 'report', 'eau-energie', 'Fuite d’eau dans la rue des Serres', 'De l’eau s’écoule en continu d’une plaque au sol depuis ce matin.', 'Rue des Serres, quartier Sud', true, false,
                ['agent' => 'technique', 'steps' => [['acknowledged', 'Équipe de la régie envoyée sur place.'], ['resolved', 'La conduite a été remplacée.']], 'priority' => ['urgent', 'Perte d’eau potable importante.']]],
            [4, 'contact', 'logement', 'Demande de changement de module', 'Notre famille s’agrandit, nous souhaiterions un module avec une chambre de plus. Quelles sont les démarches ?', null, false, false,
                ['agent' => 'accueil', 'steps' => [['acknowledged', null]], 'reply' => 'Bonjour, vous pouvez déposer votre demande au guichet 4 avec votre livret de famille. Nous vous recontactons sous 15 jours.']],
            [5, 'contact', 'education', 'Inscription à la crèche', 'Je voudrais inscrire ma fille de 8 mois à la crèche du quartier Ouest. Reste-t-il des places ?', null, false, false,
                ['agent' => 'accueil', 'steps' => [['in_progress', 'Dossier transmis à la Maison de l’enfance.']], 'reply' => 'Bonjour, il reste deux places à la crèche Ouest. Un agent vous appellera pour fixer une visite.']],
            [6, 'report', 'transports', 'Navette de 7 h 40 régulièrement en retard', 'La navette du Centre vers le Port a plus de 15 minutes de retard presque chaque matin cette semaine.', 'Arrêt Gare centrale', true, false,
                ['agent' => 'technique', 'steps' => [['acknowledged', 'Signalé à l’exploitant du réseau.']]]],
            [7, 'contact', 'etat-civil', 'Acte de naissance pour mon fils', 'Bonjour, j’ai besoin d’une copie de l’acte de naissance de mon fils né sur Nova Terra en 2025.', null, false, false,
                ['agent' => 'accueil', 'steps' => [['acknowledged', null], ['resolved', 'L’acte est disponible au guichet 1, ou envoyé dans votre espace sous 48 h.']]]],
            [8, 'report', 'voirie-eclairage', 'Passerelle Est : vitre fissurée', 'Une vitre de la passerelle pressurisée entre le Centre et l’Est présente une fissure de 20 cm.', 'Passerelle Centre – Est', true, false,
                ['agent' => 'technique', 'steps' => [['in_progress', 'Inspection de sécurité réalisée : pas de risque immédiat, remplacement commandé.']], 'priority' => ['urgent', 'Équipement pressurisé.']]],
            [9, 'contact', 'sante', 'Malaise de mon voisin', 'Mon voisin âgé a fait un malaise, il respire difficilement et ne répond plus bien. Que dois-je faire ?', 'Résidence du Sud, bâtiment B', false, true, null],
            [10, 'report', 'proprete-recyclage', 'Dépôt sauvage d’encombrants', 'Un vieux canapé et des cartons ont été abandonnés à côté de l’aire de jeux.', 'Aire de jeux du quartier Est', true, false,
                ['agent' => 'accueil', 'steps' => [['rejected', 'Ce lieu relève de la copropriété : nous avons prévenu le syndic.']]]],
            [11, 'contact', 'transports', 'Abonnement navette pour étudiant', 'Existe-t-il un tarif réduit pour les étudiants ?', null, false, false, null],
            [12, 'report', 'voirie-eclairage', 'Panneau de signalisation tombé', 'Le panneau « cédez le passage » au carrefour des Pionniers est tombé.', 'Carrefour des Pionniers', true, false, null],
            [13, 'contact', 'logement', 'Aide au loyer', 'Je viens d’arriver avec le troisième convoi et je voudrais savoir si j’ai droit à une aide au logement.', null, false, false,
                ['agent' => 'accueil', 'steps' => [['acknowledged', null]], 'reply' => 'Bienvenue ! Oui, les nouveaux arrivants bénéficient d’une aide pendant six mois. Prenez rendez-vous au guichet 4.']],
            [14, 'report', 'eau-energie', 'Coupure d’électricité répétée', 'L’électricité coupe plusieurs fois par jour dans notre immeuble depuis la maintenance.', 'Rue des Marins, quartier Port', true, false, null],
            [15, 'report', 'proprete-recyclage', 'Collecte oubliée rue des Serres', 'Les bacs n’ont pas été vidés mardi.', 'Rue des Serres', false, false,
                ['agent' => 'accueil', 'steps' => [['in_progress', 'Passage de rattrapage prévu jeudi.']]]],
            [16, 'contact', 'etat-civil', 'Inscription sur les listes électorales', 'Comment m’inscrire pour les prochaines élections municipales ?', null, false, false, null],
            [17, 'report', 'transports', 'Rover en libre-service endommagé', 'Le rover n° 12 de la station Ouest a un pneu crevé et un rétroviseur cassé.', 'Station rovers Ouest', true, false,
                ['agent' => 'technique', 'steps' => [['in_progress', 'Rover signalé à l’atelier.'], ['resolved', 'Le rover a été réparé et remis en station.']]]],
            [18, 'contact', 'education', 'Menus de la cantine', 'Où peut-on consulter les menus de la restauration scolaire ?', null, false, false, null],
            [19, 'report', 'voirie-eclairage', 'Trottoir glissant après l’arrosage des serres', 'Le trottoir devant les serres est couvert de boue à chaque arrosage, des personnes âgées ont glissé.', 'Allée 3, serres du Sud', true, false, null],
            [2, 'contact', 'sante', 'Rendez-vous de vaccination', 'Mon fils doit faire son rappel de vaccin, comment prendre rendez-vous ?', null, false, false,
                ['agent' => 'accueil', 'steps' => [['acknowledged', null]], 'reply' => 'Vous pouvez réserver un créneau en ligne dans la rubrique Rendez-vous, service Santé.']],
            [7, 'report', 'eau-energie', 'Plus d’électricité dans notre rue', 'Depuis hier soir, toute la rue des Marins est privée d’électricité plusieurs heures.', 'Rue des Marins, quartier Port', true, false, null],
        ];
    }

    /** Citoyens qui soutiennent le signalement d'indice donné (12 soutiens : passage automatique en priorité haute). */
    public const SUPPORTS = [
        0 => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        2 => [7, 13, 19],
        6 => [1, 4, 8, 12, 15],
        8 => [3, 9, 14],
        12 => [0, 5],
        14 => [7, 19, 2, 0],
        19 => [3, 15],
    ];

    /** Signalements à lier (même problème) : indice principal => autres indices. */
    public const LINKS = [14 => [21]];

    /** Inquiétudes : [citoyen, thème, sujet, message, réponse ou null]. */
    public const CONCERNS = [
        [4, 'data', 'Qui voit mes informations ?', 'Je voudrais savoir quels agents peuvent voir mon adresse et mon téléphone.', 'Seuls les agents habilités au traitement de vos demandes voient vos coordonnées ; chaque consultation est enregistrée dans le journal des actions.'],
        [9, 'service', 'Accueil au guichet', 'J’ai attendu plus d’une heure au guichet de l’état civil sans explication.', null],
        [15, 'security', 'Courriel suspect', 'J’ai reçu un courriel qui prétend venir de la mairie et me demande mon mot de passe.', 'La mairie ne demande jamais votre mot de passe. Ne répondez pas et supprimez ce message ; nous avons alerté les habitants.'],
        [18, 'other', 'Accessibilité de la gare', 'L’ascenseur de la gare centrale est souvent en panne, c’est difficile avec une poussette.', null],
    ];

    /** Idées : [citoyen, titre, description, quartier, suivi [statut, commentaire] ou null]. */
    public const IDEAS = [
        [1, 'Des bancs le long de la voie nord', 'Installer des bancs ombragés tous les 200 mètres pour les personnes âgées qui attendent la navette.', 'Nord', ['accepted', 'Idée retenue : 12 bancs seront installés au printemps.']],
        [3, 'Un marché des producteurs des serres', 'Organiser chaque samedi un marché où les serres vendent directement leurs légumes aux habitants.', 'Sud', ['in_review', 'Étude en cours avec l’association des serres partagées.']],
        [5, 'Navette de nuit le week-end', 'Prolonger une navette jusqu’à 1 h du matin le vendredi et le samedi.', null, ['in_review', null]],
        [7, 'Ateliers numériques pour les aînés', 'Proposer des ateliers à la médiathèque pour aider les seniors à utiliser l’espace citoyen.', 'Centre', ['done', 'Les ateliers ont lieu chaque mercredi à 14 h.']],
        [11, 'Fresque sur le dôme Ouest', 'Faire peindre une fresque par les enfants des écoles sur la paroi intérieure du dôme Ouest.', 'Ouest', null],
        [16, 'Un parking à vélos sécurisé au port', 'Créer un abri fermé pour les vélos près du quai des Convois.', 'Port', ['rejected', 'L’espace du quai est réservé aux opérations des convois ; une autre implantation est à l’étude.']],
    ];

    /** Avis sur les services : [citoyen, service, note, besoin satisfait, commentaire, réponse ou null]. */
    public const REVIEWS = [
        [0, 'etat-civil', 5, 'yes', 'Accueil rapide et agréable, mon acte était prêt en deux jours.', 'Merci pour votre retour !'],
        [1, 'transports', 2, 'partly', 'Les navettes sont pratiques mais souvent en retard le matin.', 'Nous travaillons avec l’exploitant pour améliorer la ponctualité aux heures de pointe.'],
        [3, 'sante', 5, 'yes', 'Téléconsultation à 2 h du matin pour ma fille, médecin très à l’écoute.', null],
        [5, 'proprete-recyclage', 4, 'yes', 'Encombrant enlevé en 48 h.', null],
        [8, 'logement', 3, 'partly', 'Dossier bien suivi mais délais longs.', null],
        [10, 'transports', 4, 'yes', 'Les rovers en libre-service sont très pratiques pour aller aux serres.', null],
        [12, 'eau-energie', 2, 'no', 'Coupures fréquentes depuis la maintenance, peu d’informations.', 'Désolés pour la gêne : la maintenance se termine dans deux jours et un message est affiché sur la page du service.'],
        [14, 'education', 5, 'yes', 'Inscription à l’école faite en ligne en dix minutes.', null],
        [17, 'sante', 4, 'yes', 'Bon accueil au centre Aurore.', null],
        [19, 'serres-partagees', 5, 'yes', 'Les ateliers du samedi sont géniaux pour les enfants.', null],
    ];
}
