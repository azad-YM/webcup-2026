# Chantier

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › Chantier
<!-- navigation:end -->

Suivi des travaux de la plateforme pendant les 24H By Webcup : ce qui est livré, ce qui est en cours et ce qui reste à faire. Les règles métier ne sont pas décrites ici. Elles restent dans le `doc` de leur BC ou de leur application, et ce dossier n’y renvoie que par des liens.

- [Registre des demandes Webcup](demandes.md) : une ligne par demande, avec son lot, son propriétaire et son statut.
- [Contexte produit et API du concours](../contexte/README.md)

## État du flux

Relevé du 2026-10-03 : vagues 6 (H+7), 7 (H+8) et 8 (H+9) diffusées, 50 demandes visibles pour 26 170 XP.

## Lots

Les lots regroupent les demandes qui partagent un même modèle ou un même écran. L’ordre de travail retenu est L1, L2, L3, L7, L4, L5, L6. L7 vient après L3 parce que les alertes s’appuient sur les publications et sur le quartier du citoyen ; L6 est court (environ 1 h) et peut être intercalé dès qu’un créneau se libère.

| Lot | Contenu | Demandes | XP | Statut |
|---|---|---|---|---|
| L0 | Séparer l’identité (IAM) des membres et rôles (Administration), retirer le gabarit Example, cadrer Citizen — [ADR 003](../technique/decisions/003-identite-et-habilitations.md) | — | — | ✅ |
| L1 | Comptes et profils : inscription citoyenne, espace personnel, rôles Agent et Administrateur, formulaire de membre | D01, D03, D08, D09 | 1 500 | 🟡 tâches 1 à 5 livrées ; parcours à vérifier dans le navigateur |
| L2 | Demandes citoyennes : envoi, confirmation, signalement, suivi, file des agents, compteur d’attente — [Citizen](../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2), [site](../../front/apps/site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2), [admin](../../front/apps/admin/doc/demandes.md) | D04, D16, F25, D11, F26, F22, D17, F49 | 2 720 | 🟡 API, site, admin et temps réel livrés ; ni testés ni vérifiés dans le navigateur |
| L3 | Services municipaux (avec recherche et filtres), publications, page d’accueil — [Administration](../../api/src/Administration/doc/README.md), [Communication](../../api/src/Communication/doc/README.md), [vitrine](../../front/apps/site/doc/vitrine-et-alertes.md), [contenus](../../front/apps/admin/doc/contenus.md) | D05, D06, F28, F32, D07 | 1 550 | 🟡 API, vitrine sur l’HTTP et module `content` livrés ; non vérifié dans un navigateur, aucun test écrit |
| L7 | Alertes et diffusion : message général, alerte ciblée par quartier, avis d’annonce importante, recommandations aux personnes vulnérables — [Communication](../../api/src/Communication/doc/README.md) | D18, F29, F30, F31 | 3 080 | 🟡 alertes, bandeau temps réel, notifications citoyennes, consentement sanitaire livrés ; non vérifié dans un navigateur, aucun test écrit |
| L4 | Accessibilité et repères : lecteur d’écran, contraste, taille du texte, fil d’Ariane, première connexion, indications contextuelles | F21, F23, F24, D15, D12, F35, D13, D20, F41, F42, F43, F44 | 6 120 | ⬜ |
| L5 | Multilingue : interface, puis contenus | D14, F27 | 1 080 | ⬜ |
| L6 | Pilotage : flux de l’API Webcup dans l’espace des agents — [Pilotage](../../api/src/Pilotage/doc/README.md), [page](../../front/apps/admin/doc/pilotage.md) | D19 | 750 | 🟡 livré, à vérifier avec la vraie clé |
| L8 | Compte et sécurité : suppression de son compte, administration des comptes citoyens par les agents, protection contre les tentatives de connexion — [Citizen](../../api/src/Citizen/doc/compte-et-securite.md), [IAM](../../api/src/IAM/doc/comptes-et-sessions.md#protection-contre-les-tentatives-de-connexion-f37), pages [comptes citoyens](../../front/apps/admin/doc/comptes-citoyens.md) et [sécurité](../../front/apps/admin/doc/securite.md) | F33, F34, F37 | 1 770 | 🟡 livré, non testé, à vérifier dans un navigateur |
| L9 | Services pratiques : transports (horaires et infos), service interrompu ou en maintenance — [Administration](../../api/src/Administration/doc/README.md) | F36, F38 | 1 180 | 🟡 état du service et horaires sur les fiches, saisis dans l’admin ; non vérifié dans un navigateur, aucun test écrit |
| L10 | Rendez-vous avec un agent et rappel — [Citizen](../../api/src/Citizen/doc/rendez-vous.md), [site](../../front/apps/site/doc/parcours-citoyen.md), [admin](../../front/apps/admin/doc/demandes.md) | F39, F40 | 900 | 🟡 API (cron `app:appointments:remind`), site et admin livrés ; ni testés ni vérifiés dans le navigateur |
| L11 | Carte des services : localiser les services physiques, hôpitaux et urgences | F45, F46 | 1 280 | ⬜ |
| L12 | Traçabilité : journal des actions de l’administration (qui a fait quoi, quand), consultable par les agents | F47, F48 | 1 600 | ⬜ |
| L13 | Tableau de bord de l’activité pour les agents | F50 | 990 | ⬜ |
| L14 | Participation : usage des données et remontée d’inquiétudes, soutien d’une demande — [Citizen](../../api/src/Citizen/doc/participation.md), [site](../../front/apps/site/doc/parcours-citoyen.md), [admin](../../front/apps/admin/doc/demandes.md) | F51, F52 | 1 650 | 🟡 API, site et admin livrés ; ni testés ni vérifiés dans le navigateur |

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

### L2 — Demandes citoyennes

1. ✅ API Citizen : `ServiceRequest` (référence `NT-2026-0042`, type `contact` \| `report`, statuts et étapes, motif obligatoire au rejet), envoi, « mes demandes », file des agents et changement de statut ; port `RequestAccessPolicy` implémenté par Administration (`admin.request.read`, `admin.request.write`, ajoutées au rôle « Agent municipal ») ; migration `Version20261003002000`.
2. ✅ Temps réel : projection `request.submitted` / `request.status_changed` vers `citizen.{citizenId}` et `administration.requests` ; audience `administration.requests` fournie par Administration.
3. ✅ Site : « Contacter la mairie », « Signaler un problème », confirmation avec la référence, « Mes demandes » (liste, détail `?ref=`, chronologie), raccourcis de `/espace`, abonnement temps réel.
4. ✅ Admin : module « Demandes citoyennes » (`/demandes`) : file filtrable, badge « N en attente », traitement avec commentaire, abonnement temps réel.
5. ⬜ Vérifier le parcours dans le navigateur (migration appliquée, worker actif, CLI d’initialisation relancée pour les nouvelles permissions) ; écrire les tests unitaires et applicatifs.

### L7 — Alertes et diffusion (à cadrer)

Décisions : BC propriétaire `Communication` ([ADR 005](../technique/decisions/005-bc-communication.md)) ; diffusion sans rechargement par le port `RealtimePublisher` et le transport `database` : buffer `realtime_event` + flux SSE `GET /api/realtime/stream` ([ADR 004](../technique/decisions/004-temps-reel.md)). Livré : socle (publisher, flux unique avec ticket et `Last-Event-ID`, audience Citizen `citizen.{id}`, client `@boilerplate/shared-utils/realtime`, purge) ; au lot L2 : projection des demandes, audience `administration.requests` d’Administration, port d’abonnement du site et de l’admin (un flux SSE par onglet). À faire : handlers de projection et `RealtimeAudienceProvider` de Communication ; le BC Communication reste à créer.
### L3, L7, L9 — Contenus, alertes et services pratiques (livrés, à vérifier)

Décisions : BC propriétaire `Communication` ([ADR 005](../technique/decisions/005-bc-communication.md)) ; diffusion sans rechargement par le port `RealtimePublisher` et le transport `database` : buffer `realtime_event` + flux SSE `GET /api/realtime/stream` ([ADR 004](../technique/decisions/004-temps-reel.md)). Livré : socle (publisher, flux unique avec ticket et `Last-Event-ID`, audience Citizen `citizen.{id}`, client `@boilerplate/shared-utils/realtime`, purge) ; BC [Communication](../../api/src/Communication/doc/README.md) (publications, alertes, projection temps réel `alert.published`, `alert.withdrawn`, `publication.important`) ; topics privés `district.{quartier}` et `alerts.health` accordés par Citizen ; port d’abonnement du module `public` du site. Reste : `RealtimeAudienceProvider` d’Administration (L2), fusion des flux du site (module `public` et demandes) en un seul flux par onglet lors de l’intégration.

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
<!-- backlinks:end -->
