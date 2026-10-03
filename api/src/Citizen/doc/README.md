# Documentation — Citizen

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Citizen
<!-- navigation:end -->

Citizen est le BC de la **relation entre les habitants et la ville de Nova Terra**. Un habitant y devient citoyen, renseigne son profil, s’adresse à la mairie, signale un problème et suit le traitement de ses demandes. Côté administration, c’est la file de travail des agents.

> **État : inscription et profil citoyen livrés côté API (lot L1, tâches 1 à 3) ; demandes citoyennes et file des agents restent la cible (lot L2).** Ce document sépare le [livré](#livré), la cible retenue ([modèle](#modèle-cible), [parcours](#parcours-cibles)) et les [questions ouvertes](#questions-ouvertes). Le suivi est dans le [chantier](../../../../doc/chantier/README.md).

## Utilisateurs

- **Visiteur** : crée son compte depuis le [site](../../../../front/apps/site/doc/README.md) et devient aussitôt citoyen.
- **Citoyen** : se connecte par e-mail et mot de passe, complète son profil quand il le souhaite, envoie des demandes et suit leur avancement.
- **Agent municipal** : consulte les demandes reçues, voit celles qui attendent une prise en charge et fait avancer leur statut depuis l’[admin](../../../../front/apps/admin/doc/README.md).

## Responsabilités

- Inscription d’un citoyen et profil personnel.
- Demandes citoyennes : message à la mairie et signalement localisé.
- Cycle de vie d’une demande et historique de ses étapes.
- Indicateurs de charge pour les agents.

Hors périmètre : comptes, mots de passe et connexion ([IAM](../../IAM/doc/README.md)) ; rôles et droits des agents, services municipaux et publications ([Administration](../../Administration/doc/README.md)).

## Décisions retenues

- **Être citoyen** : toute personne qui crée un compte depuis le site devient citoyen immédiatement. Il n’existe pas de statut « vérifié » ni de validation par un agent.
- **Connexion** : par e-mail et mot de passe, via la connexion IAM existante (`POST /api/login_check`). Pas de code à usage unique par e-mail.
- **Inscription en deux étapes** :
  1. e-mail et mot de passe (obligatoires) : création du compte IAM et du citoyen, puis connexion ;
  2. informations personnelles (facultatives) : l’étape peut être passée, et le citoyen peut les renseigner plus tard depuis son espace personnel.
- **E-mail déjà utilisé** : l’inscription est refusée avec une invitation à se connecter.

## Livré

Lot L1, tâches 1 à 3 (API). La page d’inscription et l’espace personnel du [site](../../../../front/apps/site/doc/README.md) sont en cours.

### Cas d’usage et routes

| Cas d’usage | Route | Code |
|---|---|---|
| `RegisterCitizen` | `POST /api/citizen/register` (public, POST seulement) | `Application/Command/RegisterCitizen` |
| `GetMyCitizenProfile` | `GET /api/citizen/me` | `Application/Query/GetMyCitizenProfile` |
| `UpdateMyCitizenProfile` | `PUT /api/citizen/me` | `Application/Command/UpdateMyCitizenProfile` |

Les routes respectent le [contrat HTTP](#contrat-http--inscription-et-profil-lot-l1) ci-dessous. Précisions de comportement :

- **Inscription** : `RegisterCitizen` demande le compte à IAM via `CitizenAccountProvisioner`, puis crée le citoyen ; les deux écritures et l’événement `CitizenRegistered` (publié sur `async`) partagent la transaction du `command.bus`. Un échec de la sauvegarde finale annule aussi le compte. Le compte porte comme nom la partie locale de l’e-mail. L’e-mail est normalisé en minuscules par IAM ; la comparaison avec un compte existant ignore donc la casse. L’événement ne contient ni e-mail ni mot de passe.
- **E-mail déjà utilisé** : `409` `{ "path", "message": "An account already exists for this email." }`, sans compte ni citoyen créé. `AccountAlreadyExists` étend `Shared\Domain\Exception\ConflitException` pour échapper à la traduction `\DomainException → 422` d’`AppController`.
- **Validation** : e-mail requis, valide, ≤ 255 caractères ; mot de passe de 8 à 72 **octets**. Erreur de forme → `422` `{ "path", "message" }`. Un refus résiduel d’IAM (`AccountCreationRejected`) → `422` `{ "error" }`.
- **Profil** : `PUT` remplace l’ensemble du profil. Un champ absent, `null` ou ne contenant que des espaces est enregistré à `null` ; les valeurs sont enregistrées sans espaces de début et de fin. Les champs d’identité éventuellement présents dans le payload (`id`, `userId`) sont ignorés : le citoyen est toujours celui du compte connecté. Une valeur trop longue ou d’un autre type que chaîne → `422`, sans aucune écriture. La mise à jour ne publie pas d’événement.
- **Compte non citoyen** (par exemple un agent) : `404` `{ "path", "message" }` sur `GET` et `PUT`. Sans JWT : `401` (réponse du firewall).
- `preferredLanguage` n’est contrôlé qu’en longueur (≤ 5) : la liste des langues n’est pas encore fermée (voir D14).

### Modèle et persistance

- Agrégat `Domain/Entity/Citizen` (`id`, `userId`, `registeredAt`, champs de profil facultatifs) ; `register()` enregistre `CitizenRegistered` ; `isProfileCompleted()` calcule l’indicateur.
- Table `citizens` (mapping `Infrastructure/Doctrine/Entity/Citizen.orm.xml`, migration `Version20261003001100`), unicité sur `user_id` : un compte a au plus un profil citoyen. Aucune clé étrangère vers `auth_users` (frontière de module).
- `DoctrineCitizenRepository` persiste et publie les événements sans `flush()` ; le middleware `doctrine_transaction` le porte.

### Ports et adaptateurs livrés

| Besoin de Citizen | Port (Citizen) | Adaptateur (fournisseur) |
|---|---|---|
| Créer le compte d’un nouveau citoyen | `Application/Ports/Provider/CitizenAccountProvisioner` : `create(email, password): string` (userId) ; lève `Application/Exception/AccountAlreadyExists` (409) ou `AccountCreationRejected` (422) | `IAM/Infrastructure/Adapter/Citizen/IAMCitizenAccountProvisioner` (appelle `CreateAccount`, traduit `EmailAlreadyUsed` et la violation d’unicité) |
| Connaître le compte connecté | `Application/Ports/Provider/CurrentAccountProvider` : `userId(): string` | `IAM/Infrastructure/Adapter/Citizen/IAMCurrentAccountProvider` |

Alias déclarés dans `config/services.yaml` (section « Ports intermodules »).

### Tests

`php bin/phpunit --testsuite Citizen` :

- `Unit/Command/RegisterCitizenTest`, `Unit/Command/UpdateMyCitizenProfileTest`, `Unit/Query/GetMyCitizenProfileTest` : handlers avec `RamCitizenRepository`, stubs de ports, `SequenceIdProvider` et `FixedClock` ;
- `Application/RegisterCitizenTest` : inscription anonyme puis `POST /api/login_check` et `GET /api/citizen/me`, `409` sans création, `422` sur payload invalide, événement sur `async`, rollback du compte si la sauvegarde finale échoue, événement dans la même base avec le transport Doctrine ;
- `Application/CitizenProfileTest` : vue `CitizenProfile` exacte, `401`, `404`, mise à jour et `profileCompleted`, `422` sans écriture, payload d’identité ignoré.

Le raccordement IAM est aussi testé côté fournisseur : `IAM/Tests/Suites/Unit/CitizenAccountProvisionerTest`.

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

**Demande** (`ServiceRequest`, cible lot L2) :

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

Format des erreurs : celui du socle (`{ "path", "message" }` ou `{ "error" }` pour une règle métier, selon `ExceptionListener` et `AppController`). Le site affiche un message compréhensible pour chaque code, sans exposer le message technique.

Enchaînement côté site : `POST /api/citizen/register` → `POST /api/login_check` avec les mêmes identifiants → étape « Mes informations » (`PUT /api/citizen/me`, facultative) → `/espace`.

## Ports prévus

Les ports de l’inscription et du compte connecté sont [livrés](#ports-et-adaptateurs-livrés). Reste à construire :

| Besoin de Citizen | Port (Citizen) | Adaptateur (fournisseur) |
|---|---|---|
| Vérifier qu’un agent peut lire ou traiter les demandes (lot L2) | à définir | `Administration/Infrastructure/Adapter/Citizen/…` |

Pas d’espace IAM « citoyen » : l’espace citoyen est une zone du site, qui reconnaît un citoyen grâce à `GET /api/citizen/me`.

## Questions ouvertes

- Liste des langues acceptées pour `preferredLanguage` (aujourd’hui seulement limitée à 5 caractères).
- Inscription « en double clic » : deux requêtes simultanées avec le même e-mail ; la seconde doit échouer sur la contrainte d’unicité d’IAM, que l’adaptateur traduit en `AccountAlreadyExists` (`409`) ; ce cas n’est pas couvert par un test de concurrence.
- Liste des quartiers de Nova Terra : liste fermée gérée par Administration, ou saisie libre ?
- Alertes aux personnes vulnérables (F31) : faut-il un champ facultatif « je souhaite recevoir les alertes sanitaires » ? Il faudrait un consentement explicite, sans donnée de santé détaillée.
- Transitions de statut autorisées et motif obligatoire en cas de rejet.

## Référence

- [Architecture technique](../../../../doc/technique/architecture.md) · [ADR 003 — Identité et habilitations](../../../../doc/technique/decisions/003-identite-et-habilitations.md)
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
<!-- backlinks:end -->
