# Chantier

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › Chantier
<!-- navigation:end -->

Suivi des travaux de la plateforme pendant les 24H By Webcup : ce qui est livré, ce qui est en cours et ce qui reste à faire. Les règles métier ne sont pas décrites ici. Elles restent dans le `doc` de leur BC ou de leur application, et ce dossier n’y renvoie que par des liens.

- [Registre des demandes Webcup](demandes.md) : une ligne par demande, avec son lot, son propriétaire et son statut.
- [Contexte produit et API du concours](../contexte/README.md)

## État du flux

Relevé du 2026-10-04 (H+21, 1 286 min) : vagues 19 (H+20) et 20 (H+21) diffusées, 100 demandes visibles pour 74 580 XP ; vague 21 attendue. L’API ne renvoie que la valeur des demandes (`xp_available` = `xp_total` pour toutes) : elle n’indique pas les points obtenus par l’équipe. Les demandes marquées « IA » utilisent le port Shared `LanguageModel` (API Claude, repli local sans clé).

## Revue du suivi — 2026-10-03

Les 71 demandes du [registre](demandes.md#revue-du-2026-10-03) sont couvertes par la synchronisation Pilotage `Version20261003110400`. Les suivis manuels sont conservés ; les suivis absents ou issus de l’ancien préremplissage sont actualisés avec une note par demande. Le code présent ne vaut pas validation de bout en bout. Application locale effectuée et contrôlée : **71 suivis**, dont **15 faits** (statuts manuels conservés), **34 en cours** et **22 à faire** ; 56 suivis ajoutés. Syntaxe PHP, simulation de migration, correspondance des 71 codes et liens locaux vérifiés. Aucun nouveau parcours navigateur validé.

### Validation utilisateur des parcours navigateur

À la demande de l’utilisateur, 31 demandes supplémentaires passent en « fait » dans le Pilotage local (voir le [détail de la validation](demandes.md#validation-navigateur-confirmée-par-lutilisateur)). Bilan : **46 faits, 3 en cours (F40, F63, F72), 22 à faire**. Cette validation manuelle lève les réserves de recette navigateur des lots concernés ; les mentions de tests automatisés manquants restent une dette technique. Les tableaux ci-dessous décrivent l’état technique relevé avant cette confirmation.

Notes du Pilotage local simplifiées le 2026-10-04 à la demande de l’utilisateur : une phrase courte par demande et un lien vers l’écran pour les 49 fonctionnalités existantes (site `localhost:5178`, admin `localhost:5179`). Les 22 demandes non commencées indiquent « Fonctionnalité à réaliser », sans lien vers un écran inexistant. Les statuts sont inchangés ; les réserves et validations restent dans ce chantier.

## Ajustements admin — 2026-10-04

Livré : [file des demandes](../../front/apps/admin/doc/demandes.md) ouverte sur tous les états, skeletons pendant le chargement des listes du module Demandes et [champs admin harmonisés](../../front/apps/admin/doc/navigation.md). Validation : 44 tests admin, lint et build réussis (avertissement de bundle supérieur à 500 kB). Les menus du profil du site et de l’admin affichent aussi un skeleton limité à la ligne des espaces en cours de vérification. Recette visuelle encore à réaliser.

Synchronisation déployable : commande [Pilotage — synchroniser en production](../../api/src/Pilotage/doc/README.md#synchroniser-le-suivi-en-production), avec prévisualisation, `--apply` et URL du site/admin configurables. Le snapshot inclut les statuts validés et les notes courtes ; aucune exécution en production réalisée par l’agent.

Snapshot actualisé le 2026-10-04 sur le [registre](demandes.md), après intégration de L26 et relevé des vagues 19 et 20 : **100 demandes, 89 faites, 3 en cours, 8 à faire (L27)**. À la demande de l’utilisateur, les demandes dont la seule réserve est la validation navigateur passent en « fait » ([détail](demandes.md#seconde-validation-utilisateur--2026-10-04)). Restent en cours F40 (planification du cron et réception des rappels), D14 et F27 (traduction partielle : publications et alertes non traduites). Codes, XP et difficultés vérifiés identiques à l’API du concours ; aucun test exécuté.

## Lots

Les lots regroupent les demandes qui partagent un même modèle ou un même écran. L’ordre de travail retenu est L1, L2, L3, L7, L4, L5, L6. L7 vient après L3 parce que les alertes s’appuient sur les publications et sur le quartier du citoyen ; L6 est court (environ 1 h) et peut être intercalé dès qu’un créneau se libère.

| Lot | Contenu | Demandes | XP | Statut |
|---|---|---|---|---|
| L0 | Séparer l’identité (IAM) des membres et rôles (Administration), retirer le gabarit Example, cadrer Citizen — [ADR 003](../technique/decisions/003-identite-et-habilitations.md) | — | — | ✅ |
| L1 | Comptes et profils : inscription citoyenne, espace personnel, rôles Agent et Administrateur, formulaire de membre | D01, D03, D08, D09 | 1 500 | 🟡 tâches 1 à 5 livrées ; parcours à vérifier dans le navigateur |
| L2 | Demandes citoyennes : envoi, confirmation, signalement, suivi, file des agents, compteur d’attente — [Citizen](../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2), [site](../../front/apps/site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2), [admin](../../front/apps/admin/doc/demandes.md) | D04, D16, F25, D11, F26, F22, D17, F49 | 2 720 | 🟡 API, site, admin et temps réel livrés ; ni testés ni vérifiés dans le navigateur |
| L3 | Services municipaux (avec recherche et filtres), publications, page d’accueil — [Administration](../../api/src/Administration/doc/README.md), [Communication](../../api/src/Communication/doc/README.md), [vitrine](../../front/apps/site/doc/vitrine-et-alertes.md), [contenus](../../front/apps/admin/doc/contenus.md) | D05, D06, F28, F32, D07 | 1 550 | 🟡 API, vitrine sur l’HTTP et module `content` livrés ; non vérifié dans un navigateur, aucun test écrit |
| L7 | Alertes et diffusion : message général, alerte ciblée par quartier, avis d’annonce importante, recommandations aux personnes vulnérables — [Communication](../../api/src/Communication/doc/README.md) | D18, F29, F30, F31 | 3 080 | 🟡 alertes, bandeau temps réel, notifications citoyennes, consentement sanitaire livrés ; non vérifié dans un navigateur, aucun test écrit |
| L4 | Accessibilité et repères : lecteur d’écran, contraste, taille du texte, fil d’Ariane, première connexion, indications contextuelles — pages [site](../../front/apps/site/doc/accessibilite.md) et [admin](../../front/apps/admin/doc/accessibilite.md) | F21, F23, F24, D15, D12, F35, D13, D20, F41, F42, F43, F44 | 6 120 | 🟡 panneau « Affichage », contraste, zoom, clavier, formulaires, statuts sans couleur seule, fil d’Ariane admin, guide et astuces, langage clair et glossaire livrés ; non vérifié dans un navigateur, aucun test écrit |
| L5 | Multilingue : interface, puis contenus — [site](../../front/apps/site/doc/urgences-carte-langues.md), [Administration](../../api/src/Administration/doc/README.md#lieux-urgences-et-traductions-l11-l5) | D14, F27 | 1 080 | 🟡 français, anglais, arabe (droite à gauche), sélecteur mémorisé, pages prioritaires traduites, services traduits avec repli « Non traduit » ; non testé, non vérifié dans un navigateur |
| L6 | Pilotage : flux de l’API Webcup dans l’espace des agents — [Pilotage](../../api/src/Pilotage/doc/README.md), [page](../../front/apps/admin/doc/pilotage.md) | D19 | 750 | 🟡 livré, à vérifier avec la vraie clé |
| L8 | Compte et sécurité : suppression de son compte, administration des comptes citoyens par les agents, protection contre les tentatives de connexion — [Citizen](../../api/src/Citizen/doc/compte-et-securite.md), [IAM](../../api/src/IAM/doc/comptes-et-sessions.md#protection-contre-les-tentatives-de-connexion-f37), pages [comptes citoyens](../../front/apps/admin/doc/comptes-citoyens.md) et [sécurité](../../front/apps/admin/doc/securite.md) | F33, F34, F37 | 1 770 | 🟡 livré, non testé, à vérifier dans un navigateur |
| L9 | Services pratiques : transports (horaires et infos), service interrompu ou en maintenance — [Administration](../../api/src/Administration/doc/README.md) | F36, F38 | 1 180 | 🟡 état du service et horaires sur les fiches, saisis dans l’admin ; non vérifié dans un navigateur, aucun test écrit |
| L10 | Rendez-vous avec un agent et rappel — [Citizen](../../api/src/Citizen/doc/rendez-vous.md), [site](../../front/apps/site/doc/parcours-citoyen.md), [admin](../../front/apps/admin/doc/demandes.md) | F39, F40 | 900 | 🟡 API (cron `app:appointments:remind`), site et admin livrés ; ni testés ni vérifiés dans le navigateur |
| L11 | Carte des services : localiser les services physiques, hôpitaux et urgences — [site](../../front/apps/site/doc/urgences-carte-langues.md), [Administration](../../api/src/Administration/doc/README.md#lieux-urgences-et-traductions-l11-l5) | F45, F46 | 1 280 | 🟡 `/urgences`, `/carte` (Leaflet à la demande + liste), lieux et urgences saisis dans l’admin ; non testé, non vérifié dans un navigateur |
| L12 | Traçabilité : journal des actions de l’administration (qui a fait quoi, quand), consultable par les agents | F47, F48 | 1 600 | 🟡 BC [Audit](../../api/src/Audit/doc/README.md) et écran « Journal des actions » ; non testés |
| L13 | Tableau de bord de l’activité pour les agents | F50 | 990 | 🟡 [tableau de bord](../../front/apps/admin/doc/pilotage.md#tableau-de-bord-de-lactivité-f50-non-testé) ; non testé |
| L14 | Participation : usage des données et remontée d’inquiétudes, soutien d’une demande — [Citizen](../../api/src/Citizen/doc/participation.md), [site](../../front/apps/site/doc/parcours-citoyen.md), [admin](../../front/apps/admin/doc/demandes.md) | F51, F52 | 1 650 | 🟡 API, site et admin livrés ; ni testés ni vérifiés dans le navigateur |
| L15 | Connexion renforcée : connexion sans mot de passe, vérification supplémentaire, alerte de connexion depuis un nouvel appareil | D02, F53, F54 | 2 720 | 🟡 lien e-mail lié au navigateur, code e-mail activable, appareils et alerte, « Sécurité du compte » ([IAM](../../api/src/IAM/doc/connexion-renforcee.md)) — non testé, non vérifié dans un navigateur |
| L16 | Mes données : export clair des informations personnelles, récapitulatif téléchargeable des demandes | F55, F56 | 1 700 | 🟡 « Mes données » (rubriques + JSON) et récapitulatif imprimable/CSV ([Citizen](../../api/src/Citizen/doc/mes-donnees.md)) — non testé, non vérifié dans un navigateur |
| L17 | Sobriété et performance : diagnostic environnemental, chargement sobre, connexion lente, médias légers, appareils peu puissants, version allégée | F57, F58, F59, F60, F61, F62 | 4 600 | 🟡 mesure EcoIndex locale et page `/sobriete`, JS −17 à −20 % (site) et −25 % (admin), mode léger, service worker hors ligne, brouillons — [détail](../../front/apps/site/doc/sobriete.md) ; non testé, non vérifié dans un navigateur |
| L18 | Services hors service : désactivation rapide par les administrateurs, état visible avant la démarche (prolonge L9) — [Administration](../../api/src/Administration/doc/README.md), [Citizen](../../api/src/Citizen/doc/rendez-vous.md), [admin](../../front/apps/admin/doc/contenus.md), [site](../../front/apps/site/doc/vitrine-et-alertes.md) | F63, F64 | 1 440 | 🟡 désactivation immédiate avec motif (`admin.service.disable`), refus `409` des demandes et rendez-vous, temps réel `public.services`, journal ; état en tête de fiche et des formulaires ; non testé, non vérifié dans un navigateur |
| L19 | Participation : projets en cours, consultations et avis, boîte à idées — nouveau BC [Participation](../../api/src/Participation/doc/README.md) ([ADR 008](../technique/decisions/008-bc-participation.md)), pages [site](../../front/apps/site/doc/participation.md) et [admin](../../front/apps/admin/doc/participation.md) | F65, F66, F67, F68 | 2 960 | 🟡 API (migration `Version20261003122000`, permissions `admin.participation.read`/`write`), site et espace admin « Participation » livrés ; non testé, non vérifié dans un navigateur |
| L20 | Protection des données : durcissement contre les failles, données administratives réservées aux agents habilités — [ADR 007](../technique/decisions/007-protection-des-donnees.md), [Citizen](../../api/src/Citizen/doc/compte-et-securite.md), [Shared](../../api/src/Shared/doc/README.md), [admin](../../front/apps/admin/doc/demandes.md) | F69, F70 | 2 660 | 🟡 masquage par l’API et affichage journalisé (`admin.sensitive-data.read`), inventaire des routes ; en-têtes, CSP, limitation de débit, chiffrement au repos, page « Sécurité de vos données » ; non testé, non vérifié dans un navigateur |
| L21 | Nouveaux arrivants : accès sans e-mail et en plusieurs langues (avec L5), orientation « par où commencer » | F71, F72 | 1 520 | 🟡 comptes créés à l’accueil ([ADR 010](../technique/decisions/010-comptes-crees-a-l-accueil.md)), fiche imprimable en 3 langues, connexion par identifiant, `/bienvenue` — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
| L22 | Assistance et orientation (IA) : BC [Assistance](../../api/src/Assistance/doc/README.md) ([ADR 011](../technique/decisions/011-bc-assistance.md)) — recherche tolérante sur `/services`, assistant `/aide/assistant` + bouton flottant, « Expliquer simplement », version en clair (admin et site) ; API Claude facultative, repli local sans clé ([parcours](../../front/apps/site/doc/assistance.md)) ; non testé, non vérifié dans un navigateur | D10, F89, F90, F91, F92 | 5 160 | 🟡 |
| L23 | Demandes à grande échelle : priorités, demandes similaires (IA), urgence médicale, réponse des agents, filtres citoyens, accusé de réception | F75, F79, F80, F83, F84, F86 | 5 280 | 🟡 priorités et file triée, urgence médicale (alerte, bandeau, prise en charge), demandes similaires (repli local + IA), messages agent ↔ habitant, accusé de réception vérifiable, filtres — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md), [admin](../../front/apps/admin/doc/demandes.md), [site](../../front/apps/site/doc/parcours-citoyen.md) ; migrations `Version20261004100000`–`100200`, cron `app:requests:reprioritize` ; non testé, non vérifié dans un navigateur |
| L24 | Montée en charge et sauvegarde : mode dégradé en surcharge, stabilité sous forte affluence, sauvegarde vérifiée — [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md), [exploitation](../technique/montee-en-charge.md), [admin](../../front/apps/admin/doc/securite.md) | F77, F78, F87 | 4 060 | 🟡 mode allégé (env, `app:platform:degraded`, détection auto, `503` + `Retry-After`, bandeau du site, état dans l’admin), cache public `ETag`/`304`, index, plafond et gigue SSE, `scripts/load/charge.sh`, `app:backup:run`/`app:backup:verify` avec restauration d’essai et écran « Sauvegardes » ; non testé, non vérifié dans un navigateur |
| L25 | Anti-abus et intégrité : robots, envois multiples, activité inhabituelle (IA) — [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md), [Audit](../../api/src/Audit/doc/README.md), [Shared](../../api/src/Shared/doc/README.md), [admin](../../front/apps/admin/doc/securite.md) | F81, F82, F85 | 3 730 | 🟡 jeton HMAC, champ piège et question en cas de doute ; `Idempotency-Key` rejouée ; détecteur `app:security:scan` (ports IAM, Citizen, Shared), réaction (verrouillage, code exigé, avertissement), écran « Activité inhabituelle », alerte en direct, résumé IA avec repli ; non testé, non vérifié dans un navigateur |
| L26 | Message officiel, partenaires, avis sur un service, export de suivi — [Pilotage](../../api/src/Pilotage/doc/README.md), [Communication](../../api/src/Communication/doc/README.md), [Participation](../../api/src/Participation/doc/README.md), [Administration](../../api/src/Administration/doc/README.md) | F73, F74, F76, F88 | 2 790 | 🟡 écran « Exports » (CSV/JSON, colonnes, aperçu, journal), message officiel en tête du site + archive, avis sur les services (note, réponse des agents, moyenne publique), associations partenaires (`/partenaires`, carte, horaires) ; non testé, non vérifié dans un navigateur |
| L27 | Résilience et sobriété (panne réseau, mode incident, allègement, mobile) puis nouveaux usages (transports de remplacement, services les plus utilisés, services des partenaires, événements de sécurité) — prolonge L9, L17, L24, L26, L13, L25 | F93, F94, F95, F96, F97, F98, F99, F100 | 9 790 | ⬜ |

## Travail en parallèle

Des agents travaillent en même temps dans des worktrees git séparés, chacun sur sa branche et dans sa zone de fichiers. Les contrats partagés sont fixés avant le lancement. L’intégration (fusion, résolution des conflits de configuration, vérification) est faite sur `socle/nova-terra`.

| Agent | Périmètre | Zone de fichiers | Contrat |
|---|---|---|---|
| A — Citizen API | L1 tâches 1 à 3 | `api/src/Citizen`, `api/src/IAM/Infrastructure/Adapter/Citizen`, config API | [Contrat HTTP Citizen](../../api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1) |
| B — Site | L1 tâche 4, socle du site, structure de la vitrine | `front/apps/site` | Même contrat, consommé côté site |
| C — Admin et Pilotage | L1 tâche 5, puis L6 | `api/src/Administration`, `api/src/Pilotage`, `front/apps/admin`, config API | Routes Pilotage à documenter dans son BC |

## Prochaines tâches

### L1 — Comptes et profils

Décisions : [Citizen — décisions retenues](../../api/src/Citizen/doc/README.md#décisions-retenues).

1. ✅ Créer le BC `Citizen` sur le modèle d’`Administration` : autoload, services, routes, mapping, suite PHPUnit, migration, avec l’entité `Citizen`.
2. ✅ Cas d’usage `RegisterCitizen` `{email, password}` : route publique dans le firewall, création du compte via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis création du citoyen dans la même transaction. Un e-mail déjà utilisé est refusé (`409`). `/api/auth/register` retirée.
3. ✅ Cas d’usage `GetMyCitizenProfile` et `UpdateMyCitizenProfile` (champs facultatifs : prénom, nom, téléphone, adresse, quartier, langue).

   Détail et écarts éventuels : [Citizen — livré](../../api/src/Citizen/doc/README.md#livré).
4. ✅ Site : inscription en deux étapes (compte, puis « Mes informations » que l’on peut passer), connexion automatique, espace personnel `/espace` avec le nom du citoyen, l’invitation à compléter le profil et des raccourcis. Voir le [parcours citoyen](../../front/apps/site/doc/parcours-citoyen.md) ; parcours de bout en bout à vérifier dans le navigateur.
5. ✅ Administration : rôles de référence « Agent municipal » et « Administrateur principal » à l’initialisation, liste des rôles et des membres, formulaire « Ajouter un membre » dans l’admin ([membres](../../front/apps/admin/doc/membres.md)).

Correctif profil citoyen : rechargement à l’ouverture du formulaire et conservation des champs non modifiés lors de l’enregistrement ; scénario automatisé de modification d’un seul champ ajouté. Vérification navigateur encore à réaliser.

Réorganisation de l’espace citoyen : bienvenue, guide de première visite, actions et notifications de la ville ; notifications personnelles filtrables dans la cloche, profil / espaces IAM / déconnexion dans le popover de l’avatar. Design existant réutilisé. Voir le [parcours citoyen](../../front/apps/site/doc/parcours-citoyen.md). Vérifications : 57 tests du site réussis, lint valide, build et export statique réussis dans une copie temporaire isolée (cache `.next` du répertoire de travail en erreur). Liens documentaires locaux vérifiés ; recette navigateur à réaliser.

Refonte de l’habillage admin : rail Administration / Demandes citoyennes / Pilotage, rubriques dans une seconde barre, menu des espaces Administration / Citoyen et palette alignée sur le site. Listes allégées sans quadrillage, demandes en cartes avec action « Voir la demande », boutons secondaires sans contour décoratif. Routes et workflows conservés. Voir [navigation admin](../../front/apps/admin/doc/navigation.md). Validation automatisée et recette visuelle suivies dans cette page.

### L2 — Demandes citoyennes

1. ✅ API Citizen : `ServiceRequest` (référence `NT-2026-0042`, type `contact` \| `report`, statuts et étapes, motif obligatoire au rejet), envoi, « mes demandes », file des agents et changement de statut ; port `RequestAccessPolicy` implémenté par Administration (`admin.request.read`, `admin.request.write`, ajoutées au rôle « Agent municipal ») ; migration `Version20261003002000`.
2. ✅ Temps réel : projection `request.submitted` / `request.status_changed` vers `citizen.{citizenId}` et `administration.requests` ; audience `administration.requests` fournie par Administration.
3. ✅ Site : « Contacter la mairie », « Signaler un problème », confirmation avec la référence, « Mes demandes » (liste, détail `?ref=`, chronologie), raccourcis de `/espace`, abonnement temps réel.
4. ✅ Admin : module « Demandes citoyennes » (`/demandes`) : file filtrable, badge « N en attente », traitement avec commentaire, abonnement temps réel.
5. ⬜ Vérifier le parcours dans le navigateur (migration appliquée, worker actif, CLI d’initialisation relancée pour les nouvelles permissions) ; écrire les tests unitaires et applicatifs.

### L3, L7, L9 — Contenus, alertes et services pratiques (livrés, à vérifier)

Décisions : BC propriétaire `Communication` ([ADR 005](../technique/decisions/005-bc-communication.md)) ; diffusion sans rechargement par le port `RealtimePublisher` et le transport `database` : buffer `realtime_event` + flux SSE `GET /api/realtime/stream` ([ADR 004](../technique/decisions/004-temps-reel.md)). Livré : socle (publisher, flux unique avec ticket et `Last-Event-ID`, audience Citizen `citizen.{id}`, client `@boilerplate/shared-utils/realtime`, purge) ; BC [Communication](../../api/src/Communication/doc/README.md) (publications, alertes, projection temps réel `alert.published`, `alert.withdrawn`, `publication.important`) ; topics privés `district.{quartier}` et `alerts.health` accordés par Citizen ; port d’abonnement du module `public` du site. Audience `administration.requests` fournie par Administration ; les modules du site partagent le flux SSE unique composé dans `StoreProvider`. Recette temps réel encore à réaliser.

- Une **alerte** est une publication urgente avec un niveau de gravité, une période de validité et une audience : tous les habitants, un quartier, ou les personnes ayant demandé les alertes sanitaires.
- Elle s’affiche en bandeau sur le site pendant sa validité (D18, F29) et apparaît dans les notifications de l’espace personnel des citoyens concernés (F30).
- Décidé : quartiers en **liste fermée** (Nord, Sud, Est, Ouest, Centre, Port) gérée par Administration ; recommandations F31 **rédigées à la main** par les agents (pas de génération par IA pour l’instant).
- Consentement aux alertes sanitaires : explicite, facultatif, révocable, porté par Citizen (aucune donnée de santé).
- À vérifier dans un navigateur : parcours agent (publier une alerte de quartier) → citoyen du quartier (bandeau et notifications sans rechargement). Appliquer d’abord la migration `Version20261003003000` (tables et contenu initial) et faire tourner le worker Messenger.
- Question : notifications par e-mail en plus de l’application ?

### Socle produit

- Remplacer l’habillage « Boilerplate » par l’identité de Nova Terra. Site : fait (en-tête, navigation, pied de page, fil d’Ariane, base d’accessibilité) ; admin : à faire.
- Vitrine du site : branchée sur l’API (lot L3) ; les adaptateurs locaux ne servent plus qu’aux tests existants ([site](../../front/apps/site/doc/README.md#limites-et-questions-ouvertes)).
- ✅ `WEBCUP_API_URL` et `WEBCUP_API_KEY` déclarés dans `api/.env.example` (clé vide). Reste à définir la vraie clé dans `api/.env.local` et à vérifier la page sur la vraie API.

## Quand une vague arrive

1. Consulter la page « Flux Nova Terra » de l’admin (`/pilotage`, les nouvelles demandes y sont surlignées) ou interroger l’API, et relever l’état de `session`.
2. Ajouter les nouvelles demandes au [registre](demandes.md), avec un résumé du besoin, l’XP et la difficulté.
3. Rattacher chaque demande à un lot existant ou en créer un. Choisir son BC propriétaire en suivant la [carte des modules](../contexte/README.md#carte-des-modules).
4. Réordonner les lots selon le rapport XP / effort et selon ce qui débloque d’autres demandes.
5. Mettre à jour la ligne « État du flux » ci-dessus.

## Règles de suivi

- Un statut passe à ✅ seulement quand le parcours est utilisable de bout en bout, testé et documenté chez son propriétaire.
- Une décision qui touche plusieurs BC fait l’objet d’un ADR. Les autres décisions vont dans le `doc` du BC concerné.

<!-- backlinks:start -->
---

[← Retour à Documentation](../README.md)

**Référencé depuis :**

- [Documentation](../README.md)
- [Accueil du projet](../../README.md)
- [Contexte produit](../contexte/README.md)
- [Administration](../../api/src/Administration/doc/README.md)
- [Citizen](../../api/src/Citizen/doc/README.md)
- [Site](../../front/apps/site/doc/README.md)
- [Communication](../../api/src/Communication/doc/README.md)
- [Admin — contenus](../../front/apps/admin/doc/contenus.md)
- [Site — vitrine et alertes](../../front/apps/site/doc/vitrine-et-alertes.md)
- [Site — accessibilité](../../front/apps/site/doc/accessibilite.md)
- [Admin — accessibilité](../../front/apps/admin/doc/accessibilite.md)
- [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md)
<!-- backlinks:end -->
