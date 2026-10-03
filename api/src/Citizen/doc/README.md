# Documentation — Citizen

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Citizen
<!-- navigation:end -->

Citizen est le BC de la **relation entre les habitants et la ville de Nova Terra**. Un habitant y devient citoyen, renseigne son profil, s’adresse à la mairie, signale un problème et suit le traitement de ses demandes. Côté administration, c’est la file de travail des agents.

> **État : inscription et profil citoyen (lot L1) et demandes citoyennes avec la file des agents (lot L2) livrés côté API, avec leurs écrans sur le site et l’admin ; le lot L2 n’a pas encore été vérifié dans un navigateur ni couvert par des tests.** Ce document sépare le [livré](#livré), la cible retenue ([modèle](#modèle-cible), [parcours](#parcours-cibles)) et les [questions ouvertes](#questions-ouvertes). Le suivi est dans le [chantier](../../../../doc/chantier/README.md).

## Utilisateurs

- **Visiteur** : crée son compte depuis le [site](../../../../front/apps/site/doc/README.md) et devient aussitôt citoyen.
- **Citoyen** : se connecte par e-mail et mot de passe, complète son profil quand il le souhaite, envoie des demandes et suit leur avancement.
- **Agent municipal** : consulte les demandes reçues, voit celles qui attendent une prise en charge et fait avancer leur statut depuis l’[admin](../../../../front/apps/admin/doc/README.md).

## Responsabilités

- Inscription d’un citoyen et profil personnel.
- Demandes citoyennes : message à la mairie et signalement localisé.
- Cycle de vie d’une demande et historique de ses étapes.
- Indicateurs de charge pour les agents.

Hors périmètre : comptes, mots de passe et connexion ([IAM](../../IAM/doc/README.md)) ; rôles et droits des agents, services municipaux et liste des quartiers ([Administration](../../Administration/doc/README.md)) ; publications et alertes ([Communication](../../Communication/doc/README.md)).

## Décisions retenues

- **Être citoyen** : toute personne qui crée un compte depuis le site devient citoyen immédiatement. Il n’existe pas de statut « vérifié » ni de validation par un agent.
- **Connexion** : par e-mail et mot de passe, via la connexion IAM existante (`POST /api/login_check`). Pas de code à usage unique par e-mail.
- **Inscription en deux étapes** :
  1. e-mail et mot de passe (obligatoires) : création du compte IAM et du citoyen, puis connexion ;
  2. informations personnelles (facultatives) : l’étape peut être passée, et le citoyen peut les renseigner plus tard depuis son espace personnel.
- **E-mail déjà utilisé** : l’inscription est refusée avec une invitation à se connecter.
- **Quartier** : liste fermée gérée par Administration (Nord, Sud, Est, Ouest, Centre, Port), choisie dans un sélecteur du profil.
- **Alertes sanitaires** : consentement explicite et révocable, sans donnée de santé (F31).
- **Compte existant sans profil citoyen** (par exemple un agent) : il active son espace citoyen en un clic, « Activer mon compte citoyen », sans nouvelle inscription.

## Livré

Lot L1 (API), consommé par l’inscription et l’espace personnel du [site](../../../../front/apps/site/doc/README.md). Le lot L2 (demandes) est décrit dans [Livré — demandes citoyennes](#livré--demandes-citoyennes-lot-l2).

### Cas d’usage et routes

| Cas d’usage | Route | Code |
|---|---|---|
| `RegisterCitizen` | `POST /api/citizen/register` (public, POST seulement) | `Application/Command/RegisterCitizen` |
| `GetMyCitizenProfile` | `GET /api/citizen/me` | `Application/Query/GetMyCitizenProfile` |
| `UpdateMyCitizenProfile` | `PUT /api/citizen/me` | `Application/Command/UpdateMyCitizenProfile` |
| `ActivateMyCitizenAccount` | `POST /api/citizen/me/activate` | `Application/Command/ActivateMyCitizenAccount` |
| `DeleteMyCitizenAccount` (L8) | `DELETE /api/citizen/me` | voir [compte et sécurité](compte-et-securite.md) |
| `ListCitizenAccounts`, `SetCitizenSuspension` (L8, agents) | `GET /api/citizen/accounts`, `PUT /api/citizen/accounts/suspension` | voir [compte et sécurité](compte-et-securite.md) |

Les routes respectent le [contrat HTTP](#contrat-http--inscription-et-profil-lot-l1) ci-dessous. Précisions de comportement :

- **Inscription** : `RegisterCitizen` demande le compte à IAM via `CitizenAccountProvisioner`, puis crée le citoyen ; les deux écritures et l’événement `CitizenRegistered` (publié sur `async`) partagent la transaction du `command.bus`. Un échec de la sauvegarde finale annule aussi le compte. Le compte porte comme nom la partie locale de l’e-mail. L’e-mail est normalisé en minuscules par IAM ; la comparaison avec un compte existant ignore donc la casse. L’événement ne contient ni e-mail ni mot de passe.
- **E-mail déjà utilisé** : `409` `{ "path", "message": "An account already exists for this email." }`, sans compte ni citoyen créé. `AccountAlreadyExists` étend `Shared\Domain\Exception\ConflitException` pour échapper à la traduction `\DomainException → 422` d’`AppController`.
- **Validation** : e-mail requis, valide, ≤ 255 caractères ; mot de passe de 8 à 72 **octets**. Erreur de forme → `422` `{ "path", "message" }`. Un refus résiduel d’IAM (`AccountCreationRejected`) → `422` `{ "error" }`.
- **Profil** : `PUT` remplace l’ensemble du profil. Un champ absent, `null` ou ne contenant que des espaces est enregistré à `null` ; les valeurs sont enregistrées sans espaces de début et de fin. Les champs d’identité éventuellement présents dans le payload (`id`, `userId`) sont ignorés : le citoyen est toujours celui du compte connecté. Une valeur trop longue ou d’un autre type que chaîne → `422`, sans aucune écriture. La mise à jour ne publie pas d’événement.
- **Compte non citoyen** (par exemple un agent) : `404` `{ "path", "message" }` sur `GET` et `PUT`. Sans JWT : `401` (réponse du firewall).
- **Activation** : `ActivateMyCitizenAccount` crée le citoyen du compte connecté (sans payload) et répond `200` `CitizenProfile`. Elle est idempotente : un compte déjà citoyen retrouve son profil, sans doublon ni nouvel événement. Sinon, `CitizenRegistered` est publié comme à l’inscription.
- `preferredLanguage` n’est contrôlé qu’en longueur (≤ 5) : la liste des langues n’est pas encore fermée (voir D14).

### Quartier et préférences d’alerte (lot L7, non vérifié dans un navigateur)

| Cas d’usage | Route | Code |
|---|---|---|
| `GetMyAlertPreference` | `GET /api/citizen/me/alert-preferences` → `200 {district, healthConsent}` | `Application/Query/GetMyAlertPreference` |
| `SetMyAlertPreference` | `PUT /api/citizen/me/alert-preferences` `{healthConsent: bool}` → `200 {district, healthConsent}` | `Application/Command/SetMyAlertPreference` |

- **Quartier en liste fermée** : `PUT /api/citizen/me` refuse un quartier hors de la liste d’Administration (`400`, « Quartier inconnu… ») via le port `DistrictDirectory`. Le site propose un sélecteur alimenté par `GET /api/administration/districts`. Une valeur enregistrée avant cette règle reste lisible.
- **Consentement aux alertes sanitaires** (F31) : explicite, facultatif, révocable à tout moment depuis l’espace citoyen ; par défaut, aucun consentement. Aucune donnée médicale n’est demandée ni stockée : seule la case cochée. Agrégat `Domain/Entity/AlertPreference`, table `citizen_alert_preference` (migration `Version20261003003000`).
- `404` pour un compte non citoyen, `401` sans JWT ; l’identité vient toujours du compte connecté.
- Aucun test automatisé n’a été écrit pour ces cas d’usage (décision d’économie du chantier).

### Modèle et persistance

- Agrégat `Domain/Entity/Citizen` (`id`, `userId`, `registeredAt`, champs de profil facultatifs) ; `register()` enregistre `CitizenRegistered` ; `isProfileCompleted()` calcule l’indicateur.
- Table `citizens` (mapping `Infrastructure/Doctrine/Entity/Citizen.orm.xml`, migration `Version20261003001100`), unicité sur `user_id` : un compte a au plus un profil citoyen. Aucune clé étrangère vers `auth_users` (frontière de module).
- `DoctrineCitizenRepository` persiste et publie les événements sans `flush()` ; le middleware `doctrine_transaction` le porte.

### Ports et adaptateurs livrés

| Besoin de Citizen | Port (Citizen) | Adaptateur (fournisseur) |
|---|---|---|
| Créer le compte d’un nouveau citoyen | `Application/Ports/Provider/CitizenAccountProvisioner` : `create(email, password): string` (userId) ; lève `Application/Exception/AccountAlreadyExists` (409) ou `AccountCreationRejected` (422) | `IAM/Infrastructure/Adapter/Citizen/IAMCitizenAccountProvisioner` (appelle `CreateAccount`, traduit `EmailAlreadyUsed` et la violation d’unicité) |
| Connaître le compte connecté | `Application/Ports/Provider/CurrentAccountProvider` : `userId(): string` | `IAM/Infrastructure/Adapter/Citizen/IAMCurrentAccountProvider` |
| Valider le quartier du profil | `Application/Ports/Provider/DistrictDirectory` : `exists(district): bool` | `Administration/Infrastructure/Adapter/Citizen/AdminCitizenDistrictDirectory` |

Citizen fournit aussi des adaptateurs aux autres modules :

| Consommateur | Port | Adaptateur (Citizen) |
|---|---|---|
| [Communication](../../Communication/doc/README.md) (notifications ciblées) | `Communication\Application\Ports\Provider\AudienceProvider` | `Infrastructure/Adapter/Communication/CitizenAudienceProvider` (quartier, consentement du citoyen connecté) |
| Temps réel (Shared) | `Shared\Application\Ports\Provider\RealtimeAudienceProvider` | `Infrastructure/Adapter/Shared/CitizenRealtimeAudience` (`citizen.{id}`) et `CitizenAlertRealtimeAudience` (`district.{quartier en minuscules}`, `alerts.health` si consentement), topics définis par Communication |

Alias déclarés dans `config/services.yaml` (section « Ports intermodules »).

### Tests

`php bin/phpunit --testsuite Citizen` :

- `Unit/Command/RegisterCitizenTest`, `Unit/Command/UpdateMyCitizenProfileTest`, `Unit/Query/GetMyCitizenProfileTest` : handlers avec `RamCitizenRepository`, stubs de ports, `SequenceIdProvider` et `FixedClock` ;
- `Application/RegisterCitizenTest` : inscription anonyme puis `POST /api/login_check` et `GET /api/citizen/me`, `409` sans création, `422` sur payload invalide, événement sur `async`, rollback du compte si la sauvegarde finale échoue, événement dans la même base avec le transport Doctrine ;
- `Application/CitizenProfileTest` : vue `CitizenProfile` exacte, `401`, `404`, mise à jour et `profileCompleted`, `422` sans écriture, payload d’identité ignoré.

Le raccordement IAM est aussi testé côté fournisseur : `IAM/Tests/Suites/Unit/CitizenAccountProvisionerTest`.

## Livré — demandes citoyennes (lot L2)

Consommé par « Mes demandes » du [site](../../../../front/apps/site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2) et par le module « Demandes citoyennes » de l’[admin](../../../../front/apps/admin/doc/demandes.md). Demandes Webcup : D04, D16, F25, D11, F26, F22, D17. **Aucun test automatisé n’a été écrit pour ce lot** et le parcours n’a pas encore été vérifié dans un navigateur.

### Cas d’usage et routes

| Cas d’usage | Route | Accès | Code |
|---|---|---|---|
| `SubmitServiceRequest` | `POST /api/citizen/requests` | citoyen connecté | `Application/Command/SubmitServiceRequest` |
| `ListMyServiceRequests` | `GET /api/citizen/requests` | citoyen connecté | `Application/Query/ListMyServiceRequests` |
| `GetMyServiceRequest` | `GET /api/citizen/requests/{reference}` | citoyen connecté, auteur | `Application/Query/GetMyServiceRequest` |
| `ListRequestQueue` | `GET /api/citizen/agent/requests?status=&page=` | `admin.request.read` | `Application/Query/ListRequestQueue` |
| `ChangeRequestStatus` | `POST /api/citizen/agent/requests/status` | `admin.request.read` + `admin.request.write` | `Application/Command/ChangeRequestStatus` |

Règles appliquées :

- **Auteur** : toujours le citoyen du compte connecté (`CurrentAccountProvider`), jamais le payload. Un compte non citoyen reçoit `404` sur les routes du citoyen. La demande d’un autre citoyen répond `404`, comme une référence inconnue.
- **Référence** : `NT-{année}-{numéro sur 4 chiffres}` (ex. `NT-2026-0042`), numérotée par année. `SqlServiceRequestReferenceGenerator` lit le plus grand numéro de l’année sous verrou (`SELECT … FOR UPDATE`) dans la transaction du `command.bus` ; l’index unique sur `reference` reste la garantie finale (un envoi concurrent exceptionnel échoue au lieu de dupliquer une référence).
- **Contenu** : `type` `contact` | `report` ; `subject` 1–160 caractères ; `description` 1–5 000 ; `location` ≤ 255, **obligatoire pour un signalement** ; `serviceId` ≤ 100, facultatif (identifiant d’un service d’Administration, non vérifié tant que le catalogue L3 n’est pas une API). Espaces de début et de fin retirés ; une valeur vide facultative est enregistrée à `null`.
- **Cycle de vie** : `submitted` → `acknowledged` → `in_progress` → `resolved` | `rejected`. Transitions autorisées : `submitted` → `acknowledged`, `in_progress`, `rejected` ; `acknowledged` → `in_progress`, `resolved`, `rejected` ; `in_progress` → `resolved`, `rejected` ; `resolved` et `rejected` sont finaux. Une transition interdite → `409` (`InvalidRequestTransition`).
- **Étapes** : chaque changement ajoute `{status, at, comment}` à `steps` (la première étape `submitted` est créée à l’envoi). Commentaire ≤ 2 000 caractères, visible par le citoyen ; **motif obligatoire au rejet** (`422` sinon).
- **Concurrence entre agents** : la commande porte `expectedStatus`, le statut vu par l’agent ; s’il a changé entre-temps → `409`. Le champ `version` (verrou optimiste Doctrine) protège en dernier recours.
- **File des agents** : les plus anciennes d’abord, 20 par page, filtre facultatif par statut (statut inconnu → `400`). `pendingCount` compte les demandes `submitted` (en attente de prise en charge, D17), quel que soit le filtre. `canProcess` indique si l’agent peut changer les statuts.
- **Événements de domaine** : `ServiceRequestSubmitted` (`requestId`, `citizenId`, `reference`) et `ServiceRequestStatusChanged` (+ `previousStatus`, `status`), enregistrés par l’agrégat, publiés sur `async` dans la transaction du `command.bus`.

### Temps réel

Projection par `Application/Listener/PublishServiceRequestRealtime` (handler de `event.bus`, exécuté par le worker), vers le port `Shared\Application\Ports\Service\RealtimePublisher` ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)) :

| Événement de domaine | Événement temps réel | Topics |
|---|---|---|
| `ServiceRequestSubmitted` | `request.submitted` | `citizen.{citizenId}`, `administration.requests` |
| `ServiceRequestStatusChanged` | `request.status_changed` | `citizen.{citizenId}`, `administration.requests` |

Payload : `{ "requestId", "reference", "status" }` (+ `previousStatus` pour un changement), sans aucune donnée personnelle ni contenu de la demande. Les écrans relisent l’API. Audiences : `citizen.{citizenId}` est accordé par `Infrastructure/Adapter/Shared/CitizenRealtimeAudience` ; `administration.requests` par Administration (`AdminRequestsRealtimeAudience`, membres actifs ayant `admin.request.read`).

### Modèle et persistance

- Agrégat `Domain/Entity/ServiceRequest` (`submit()`, `changeStatus()`, `allowedTransitions()`), exception `Domain/Exception/InvalidRequestTransition` (`409`).
- Table `citizen_service_requests` (mapping `Infrastructure/Doctrine/Entity/ServiceRequest.orm.xml`, migration `Version20261003002000`) : unicité de `reference`, index `(citizen_id, created_at)` et `(status, created_at)`, `steps` en JSON, `version` pour le verrou optimiste. Aucune clé étrangère vers `citizens` ni vers un autre module.
- `DoctrineServiceRequestRepository` persiste et publie les événements sans `flush()`.

### Ports et adaptateurs

| Besoin de Citizen | Port (Citizen) | Adaptateur |
|---|---|---|
| Droits d’un agent sur la file | `Application/Ports/Provider/RequestAccessPolicy` : `canReadRequests()` (`admin.request.read`), `canProcessRequests()` (`admin.request.read` + `admin.request.write`) | `Administration/Infrastructure/Adapter/Citizen/AdminRequestAccessPolicy` (membre actif) |
| Référence lisible | `Application/Ports/Service/ServiceRequestReferenceGenerator` | `Infrastructure/Doctrine/Service/SqlServiceRequestReferenceGenerator` (propre infrastructure) |
| Publication temps réel | `Shared\Application\Ports\Service\RealtimePublisher` (socle) | fabrique de `Shared` selon `REALTIME_TRANSPORT` |

### Contrat HTTP — demandes (lot L2)

**Vue `ServiceRequest`** (réponse commune) :

```json
{
  "id": "uuid",
  "reference": "NT-2026-0042",
  "type": "report",
  "serviceId": null,
  "subject": "Lampadaire éteint",
  "description": "Le lampadaire devant le n° 12 ne s’allume plus.",
  "location": "12 rue des Palmiers",
  "status": "acknowledged",
  "steps": [
    { "status": "submitted", "at": "2026-10-03T14:30:00+00:00", "comment": null },
    { "status": "acknowledged", "at": "2026-10-03T15:02:00+00:00", "comment": "Transmis au service voirie." }
  ],
  "allowedTransitions": ["in_progress", "resolved", "rejected"],
  "createdAt": "2026-10-03T14:30:00+00:00",
  "updatedAt": "2026-10-03T15:02:00+00:00"
}
```

| Méthode | Route | Corps / paramètres | Succès | Erreurs |
|---|---|---|---|---|
| POST | `/api/citizen/requests` | `{ "type", "subject", "description", "location"?: string \| null, "serviceId"?: string \| null }` | `200` `ServiceRequest` | `401` ; `404` non citoyen ; `422` payload invalide ou lieu manquant pour un signalement |
| GET | `/api/citizen/requests` | — | `200` `{ "items": ServiceRequest[] }` (plus récentes d’abord) | `401` ; `404` non citoyen |
| GET | `/api/citizen/requests/{reference}` | — | `200` `ServiceRequest` | `401` ; `404` non citoyen, référence inconnue ou demande d’un autre citoyen |
| GET | `/api/citizen/agent/requests` | `status` (facultatif, un des cinq statuts), `page` (≥ 1) | `200` `{ "items": ServiceRequest[], "total", "pendingCount", "page", "pageSize": 20, "canProcess" }` | `401` ; `403` sans `admin.request.read` ; `400` statut inconnu |
| POST | `/api/citizen/agent/requests/status` | `{ "requestId", "status", "expectedStatus", "comment"?: string \| null }` | `200` `ServiceRequest` | `401` ; `403` sans les deux permissions ; `404` demande inconnue ; `409` statut changé entre-temps ou transition interdite ; `422` motif de rejet manquant, payload invalide |

## Modèle cible

**Citoyen** (`Citizen`, livré) :

| Champ | Obligatoire | Usage |
|---|---|---|
| `id`, `userId` | oui | Lien avec le compte IAM |
| `registeredAt` | oui | Date d’inscription |
| `firstName`, `lastName` | non | Personnalisation de l’espace, traitement des demandes |
| `phone` | non | Recontact par les services |
| `address` | non | Pré-remplissage des signalements |
| `district` (quartier) | non | Alertes ciblées par quartier (F29) |
| `preferredLanguage` | non | Langue de l’interface (D14) |

Le profil est « complété » quand les champs facultatifs utiles sont renseignés ; ce n’est qu’un indicateur pour guider le citoyen (D12), jamais une condition d’accès.

**Demande** (`ServiceRequest`, livrée au lot L2, voir [ci-dessus](#livré--demandes-citoyennes-lot-l2)) :

| Champ | Rôle | Demandes Webcup |
|---|---|---|
| `reference` (ex. `NT-2026-0042`) | Confirmation lisible après l’envoi | D16 |
| `type` : `contact` \| `report` | Message à la mairie ou signalement sur l’espace public | D04, F25 |
| `serviceId` (optionnel) | Service municipal concerné, par identifiant | D05 |
| `subject`, `description` | Contenu de la demande | D04, F25 |
| `location` (texte libre, optionnel) | Lieu du signalement | F25 |
| `citizenId` | Auteur | D11, F26 |
| `status` : `submitted` → `acknowledged` → `in_progress` → `resolved` \| `rejected` | État courant | F22, D17 |
| `steps[]` : `{status, at, comment}` | Historique visible par le citoyen | D11 |
| `createdAt` | Tri et historique | F26 |

## Parcours cibles

- **Inscription** (D01) : le site appelle une route publique de Citizen avec e-mail et mot de passe. Citizen demande le compte à IAM puis crée le citoyen dans la même transaction. Le site connecte ensuite le citoyen et propose l’étape « Mes informations », que l’utilisateur peut passer.
- **Espace personnel** (D03, D12) : accueil du citoyen, invitation à compléter le profil, accès aux services et aux demandes.
- **Envoi d’une demande** : formulaire, puis écran de confirmation qui affiche la référence (D04, D16, F25).
- **Mes demandes** : liste, statut et chronologie des étapes (D11, F26).
- **File des agents** : liste filtrable par statut, compteur « en attente », changement de statut avec commentaire (F22, D17).

## Contrat HTTP — inscription et profil (lot L1)

Contrat fixé avant développement : l’API (Citizen) et le site s’y conforment. Toute évolution est faite ici d’abord.

**Vue `CitizenProfile`** (réponse commune) :

```json
{
  "id": "uuid",
  "firstName": null,
  "lastName": null,
  "phone": null,
  "address": null,
  "district": null,
  "preferredLanguage": null,
  "registeredAt": "2026-10-03T14:30:00+00:00",
  "profileCompleted": false
}
```

`profileCompleted` vaut `true` quand `firstName`, `lastName` et `district` sont renseignés. L’e-mail n’est pas dans cette vue : le site le lit via `GET /api/iam/me`.

| Méthode | Route | Accès | Corps | Succès | Erreurs |
|---|---|---|---|---|---|
| POST | `/api/citizen/register` | public | `{ "email": string, "password": string (8–72 octets) }` | `200` `{ "citizenId": string }` | `422` payload invalide ; `409` e-mail déjà utilisé |
| GET | `/api/citizen/me` | JWT | — | `200` `CitizenProfile` | `401` sans session ; `404` le compte n’est pas citoyen |
| PUT | `/api/citizen/me` | JWT | tous les champs de `CitizenProfile` modifiables, chacun `string \| null` : `firstName`, `lastName` (≤ 100), `phone` (≤ 30), `address` (≤ 255), `district` (≤ 100), `preferredLanguage` (`fr` \| `en` \| …, ≤ 5) | `200` `CitizenProfile` | `401` ; `404` non citoyen ; `422` valeur invalide |
| POST | `/api/citizen/me/activate` | JWT | — | `200` `CitizenProfile` (idempotent) | `401` sans session |

Format des erreurs : celui du socle (`{ "path", "message" }` ou `{ "error" }` pour une règle métier, selon `ExceptionListener` et `AppController`). Le site affiche un message compréhensible pour chaque code, sans exposer le message technique.

Enchaînement côté site : `POST /api/citizen/register` → `POST /api/login_check` avec les mêmes identifiants → étape « Mes informations » (`PUT /api/citizen/me`, facultative) → `/espace`.

## Ports prévus

Les ports de l’inscription, du compte connecté ([L1](#ports-et-adaptateurs-livrés)) et des droits des agents ([L2](#ports-et-adaptateurs)) sont livrés.

Pas d’espace IAM « citoyen » : l’espace citoyen est une zone du site, qui reconnaît un citoyen grâce à `GET /api/citizen/me`.

## Questions ouvertes

- Liste des langues acceptées pour `preferredLanguage` (aujourd’hui seulement limitée à 5 caractères).
- Inscription « en double clic » : deux requêtes simultanées avec le même e-mail ; la seconde doit échouer sur la contrainte d’unicité d’IAM, que l’adaptateur traduit en `AccountAlreadyExists` (`409`) ; ce cas n’est pas couvert par un test de concurrence.
- Liste des quartiers de Nova Terra : liste fermée gérée par Administration, ou saisie libre ?
- Alertes aux personnes vulnérables (F31) : faut-il un champ facultatif « je souhaite recevoir les alertes sanitaires » ? Il faudrait un consentement explicite, sans donnée de santé détaillée.
- Demandes (L2) : faut-il vérifier `serviceId` auprès du catalogue d’Administration une fois le lot L3 livré (port à créer) ? Faut-il une pagination de « Mes demandes » au-delà de quelques dizaines de demandes ? Faut-il prévenir le citoyen hors de la plateforme (e-mail) à chaque étape ?
- Retour en arrière d’un statut (ex. `in_progress` → `acknowledged`) : non autorisé aujourd’hui.
- Transitions de statut autorisées et motif obligatoire en cas de rejet.

## Référence

- [Compte et sécurité — suppression, suspension, liste des comptes (L8)](compte-et-securite.md)
- [Architecture technique](../../../../doc/technique/architecture.md) · [ADR 003 — Identité et habilitations](../../../../doc/technique/decisions/003-identite-et-habilitations.md) · [ADR 004 — Temps réel](../../../../doc/technique/decisions/004-temps-reel.md)
- [IAM — comptes et sessions](../../IAM/doc/comptes-et-sessions.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Administration](../../Administration/doc/README.md)
- [IAM](../../IAM/doc/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
- [IAM — comptes et sessions](../../IAM/doc/comptes-et-sessions.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md)
- [ADR 004 — Temps réel](../../../../doc/technique/decisions/004-temps-reel.md)
- [Communication](../../Communication/doc/README.md)
- [Site — vitrine et alertes](../../../../front/apps/site/doc/vitrine-et-alertes.md)
<!-- backlinks:end -->
