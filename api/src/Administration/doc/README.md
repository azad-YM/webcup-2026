# Documentation — Administration

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Administration
<!-- navigation:end -->

Administration est le BC de l’**organisation municipale de Nova Terra**. Il répond à « qui travaille pour la ville et que peut-il faire ? » : il porte les membres de l’administration (agents, administrateurs), leurs rôles et le catalogue des permissions. Il décide de l’accès à l’espace de travail `admin` et autorise les opérations sensibles des autres BC. Il porte aussi le **catalogue des services municipaux** (fiche, mise en avant, état du service, horaires des transports) et la **liste fermée des quartiers**. Les publications et les alertes appartiennent au BC [Communication](../../Communication/doc/README.md) ([ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)), qui consulte Administration pour autoriser les agents et valider les quartiers.

Administration ne connaît pas les mots de passe ni les sessions : chaque membre référence un compte [IAM](../../IAM/doc/README.md) par son `userId`. La création du compte est demandée à IAM via un port.

## Utilisateurs et consommateurs

- **Administrateur** : crée les rôles, ajoute des agents ou d’autres administrateurs.
- **Agent municipal** : membre disposant du rôle de référence `municipal-agent` (« Agent municipal »), créé par la CLI d’initialisation ; il consulte le flux de pilotage et traite les demandes citoyennes (`admin.request.read`, `admin.request.write`, lot L2).
- **Administrateur existant** : relancer la [CLI d’initialisation](initialisation-admin.md) pour ajouter les nouvelles permissions du catalogue au rôle « Administrateur principal » et resynchroniser « Agent municipal ».
- **Consommateurs techniques** :
  - l’application [admin](../../../../front/apps/admin/doc/README.md) (rôles, membres) ;
  - [IAM](../../IAM/doc/README.md), qui obtient l’espace `admin` via `AdminAccessibleSpacesProvider` ;
  - [Pilotage](../../Pilotage/doc/README.md), qui réserve le flux du concours aux membres ayant `admin.pilotage.read` via `AdminPilotageAccessPolicy` ;
  - [Citizen](../../Citizen/doc/README.md), qui réserve la file des demandes aux membres ayant `admin.request.read` (et `admin.request.write` pour les traiter) via `AdminRequestAccessPolicy` ;
  - le flux temps réel de [Shared](../../Shared/doc/README.md), qui ouvre le topic `administration.requests` à ces mêmes membres via `AdminRequestsRealtimeAudience` ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)).
  - [Citizen](../../Citizen/doc/README.md), qui valide le quartier du profil via `AdminCitizenDistrictDirectory` (et autorisera les agents via un port à définir) ;
  - [Communication](../../Communication/doc/README.md), qui autorise les agents via `AdminCommunicationAccessPolicy` (`admin.communication.write`) et valide le quartier d’une alerte via `AdminCommunicationDistrictDirectory` ;
  - le [site](../../../../front/apps/site/doc/README.md) (catalogue public, fiche, état, horaires, sélecteur de quartier) et le module `content` de l’[admin](../../../../front/apps/admin/doc/contenus.md) (gestion du catalogue).

## Livré

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/administration/permissions` | Catalogue des permissions |
| GET | `/api/administration/roles` | Liste des rôles `{id, name, permissions[]}` |
| POST | `/api/administration/roles` | Création d’un rôle |
| GET | `/api/administration/members` | Liste des membres `{id, userId, name, roles[{id, name}], active}` |
| POST | `/api/administration/members` | Ajout d’un membre et création de son compte IAM |

### Services municipaux et quartiers (lots L3 et L9, non vérifiés dans un navigateur)

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/api/administration/services` | public | Catalogue ; filtres facultatifs `?q=` (tous les termes, sans accents ni casse, dans le nom, le résumé, le thème et les mots-clés), `?category=`, `?featured=1`. Tri : mis en avant d’abord, puis par nom |
| GET | `/api/administration/services/{id}` | public | Fiche d’un service, sinon `404` |
| PUT | `/api/administration/services` | `admin.service.write` | Crée ou remplace un service (identifiant fourni) ; réponse : la fiche |
| POST | `/api/administration/services/availability` | `admin.service.disable` | L18/F63 : `{id, disabled, reason}` — désactive immédiatement (motif de 5 à 500 caractères, obligatoire) ou réactive un service ; réponse : la fiche |
| GET | `/api/administration/districts` | public | Liste fermée des quartiers : `["Nord","Sud","Est","Ouest","Centre","Port"]` |

Fiche d’un service :

```json
{ "id": "transports", "name": "Transports", "category": "mobilite", "summary": "…", "description": "…",
  "actions": ["…"], "contact": {"place": "…", "hours": "…", "phone": "…"}, "featured": true, "keywords": ["…"],
  "status": "available", "statusMessage": "", "returnAt": null, "alternative": "",
  "transport": {"route": "…", "timetable": "…", "information": "…"}, "updatedAt": "…",
  "disabled": false, "disabledReason": "", "disabledAt": null }
```

Règles :

- Identifiant : minuscules, chiffres et tirets (80 caractères), non modifiable. Thèmes : `demarches`, `cadre-de-vie`, `sante-solidarite`, `mobilite`, `habitat`, `famille`. Nom, thème, résumé, description, au moins une démarche, lieu et horaires d’accueil requis.
- **Mise en avant** (F28) : `featured` affiche le service dans « Services les plus demandés » de l’accueil.
- **État** (F38) : `available`, `maintenance` ou `incident`. Hors `available`, un message aux habitants est obligatoire ; une date de retour (`returnAt`) et une alternative sont facultatives. Revenir à `available` efface ces champs.
- **Désactivation d’urgence** (L18/F63, non testé) : indépendante de l’état F38. Un service désactivé refuse, côté Citizen, les nouvelles demandes et les réservations ou déplacements de rendez-vous (erreur `409`, code `service_disabled`, message français indiquant quoi faire), via le port `MunicipalServiceDirectory`. Les demandes et rendez-vous existants sont conservés (l’annulation reste possible). Effet immédiat : la lecture se fait dans la transaction suivante, et l’événement `service.availability` `{id, disabled}` part sur le topic public `public.services` (ADR 004) pour mettre à jour le site sans rechargement. Journal : `administration.service.disabled` (avec le motif) et `administration.service.enabled`. Enregistrer la fiche (`PUT`) ne modifie pas la désactivation. Permission dédiée `admin.service.disable` (voir ci-dessous).
- **Transports** (F36) : `transport` (lignes et trajets, horaires, informations pratiques) n’est accepté que pour un service du thème `mobilite`.
- Une règle refusée répond `400` avec un message français ; rien n’est enregistré.
- Contenu initial : les huit services de la vitrine (dont les horaires des navettes) sont insérés par la migration `Version20261003003000` (table `municipal_service`).
- Aucun test automatisé n’a été écrit pour ces cas d’usage (décision d’économie du chantier).

CLI : `php bin/console app:admin:bootstrap` ([initialisation de l’administrateur principal et des rôles de référence](initialisation-admin.md)).

Interface : la page [Membres](../../../../front/apps/admin/doc/membres.md) de l’admin liste les membres et ajoute un membre ; la page [Rôles](../../../../front/apps/admin/doc/roles.md) crée les rôles.

## Ports et raccordements

| Sens | Port (propriétaire) | Adaptateur (fournisseur) |
|---|---|---|
| Administration consomme IAM | `Application/Ports/Provider/CurrentAccountProvider` | `IAM/Infrastructure/Adapter/Administration/IAMCurrentAccountProvider` |
| Administration consomme IAM | `Application/Ports/Provider/MemberAccountProvisioner` | `IAM/Infrastructure/Adapter/Administration/IAMMemberAccountProvisioner` |
| IAM consomme Administration | `IAM\…\AccessibleSpacesProvider` | `Infrastructure/Adapter/IAM/AdminAccessibleSpacesProvider` |
| Pilotage consomme Administration | `Pilotage\Application\Ports\Provider\PilotageAccessPolicy` | `Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` (`admin.pilotage.read`, `admin.pilotage.write`) |
| Tableau de bord Pilotage (F50) | `Pilotage\Application\Ports\Provider\Activity\AdministrationActivityProvider` | `Infrastructure/Adapter/Pilotage/AdminPilotageActivity` (membres actifs, services perturbés) |
| Audit consomme Administration (L12) | `Audit\Application\Ports\Provider\AuditAccessPolicy` | `Infrastructure/Adapter/Audit/AdminAuditAccessPolicy` (`admin.audit.read`, `admin.security.read`) |
| Citizen consomme Administration (L8) | `Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy` | `Infrastructure/Adapter/Citizen/AdminCitizenAccountAccessPolicy` (`admin.citizen.read`, `admin.citizen.write`) |
| IAM consomme Administration (L8) | `IAM\Application\Ports\Provider\SecurityJournalAccessPolicy` | `Infrastructure/Adapter/IAM/AdminSecurityJournalAccessPolicy` (`admin.security.read`) |
| Citizen consomme Administration | `Citizen\Application\Ports\Provider\RequestAccessPolicy` | `Infrastructure/Adapter/Citizen/AdminRequestAccessPolicy` (`admin.request.read` ; traitement : `admin.request.read` + `admin.request.write`) |
| Citizen consomme Administration (L18) | `Citizen\Application\Ports\Provider\MunicipalServiceDirectory` | `Infrastructure/Adapter/Citizen/AdminCitizenServiceDirectory` : nom, accueil, état F38 et désactivation F63 du service |
| Citizen consomme Administration (L20/F70) | `Citizen\Application\Ports\Provider\SensitiveDataAccessPolicy` | `Infrastructure/Adapter/Citizen/AdminSensitiveDataAccessPolicy` (`admin.sensitive-data.read`) |
| Shared (flux temps réel) consomme Administration | `Shared\Application\Ports\Provider\RealtimeAudienceProvider` (tag automatique) | `Infrastructure/Adapter/Shared/AdminRequestsRealtimeAudience` : topic `administration.requests` pour `admin.request.read` |

Les deux adaptateurs s’appuient sur les requêtes internes `CheckCurrentMemberPermissions` (compte connecté) et `CheckMemberPermissions` (compte donné, utilisé par le flux temps réel) : membre actif, union des permissions de ses rôles.
| Communication consomme Administration | `Communication\Application\Ports\Provider\CommunicationAccessPolicy` | `Infrastructure/Adapter/Communication/AdminCommunicationAccessPolicy` (`admin.communication.write`) |
| Communication consomme Administration | `Communication\Application\Ports\Provider\DistrictDirectory` | `Infrastructure/Adapter/Communication/AdminCommunicationDistrictDirectory` |
| Citizen consomme Administration | `Citizen\Application\Ports\Provider\DistrictDirectory` | `Infrastructure/Adapter/Citizen/AdminCitizenDistrictDirectory` |

Permissions ajoutées au catalogue : `admin.service.write` (catalogue des services) et `admin.communication.write` (publications et alertes), données au rôle de référence « Agent municipal » par la CLI d’initialisation.

L18/L20 (migrations `Version20261003120000` et `Version20261003120100`, CLI d’initialisation resynchronisée) :

- `admin.service.disable` (action `disable` ajoutée à `Domain/VO/Permission`) : couper un service en urgence. **Permission dédiée** plutôt que `admin.service.write` : c’est un interrupteur à effet immédiat sur les habitants, qu’on veut pouvoir confier à un agent d’astreinte sans lui ouvrir la rédaction du catalogue, et inversement retirer à un rédacteur. Donnée à l’administrateur principal **et** à l’agent municipal (l’agent est le premier à constater la panne au guichet).
- `admin.sensitive-data.read` (F70) : afficher les données personnelles sensibles des habitants dans l’admin (téléphone, adresse, e-mail complet, lieu d’une demande de contact). Donnée **au seul administrateur principal** ; à accorder par un rôle dédié aux agents qui en ont besoin. Voir l’[ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md).

### Inventaire des routes d’agent (F70)

Toutes les routes `/api` exigent une session (`IS_AUTHENTICATED_FULLY`), sauf la vitrine en lecture (services, quartiers, publications, alertes générales), l’inscription, la connexion, l’échange du code de portail et le flux SSE (`security.yaml`). Chaque route d’agent vérifie en plus une permission **dans le cas d’usage du BC propriétaire** (vérifié le 2026-10-04 : aucune route oubliée).

| Route | Permission vérifiée |
|---|---|
| `GET /api/administration/permissions`, `GET /api/administration/roles` | `admin.role.read` ou `admin.role.write` (politiques `PermissionCatalogAccessPolicy`, `RoleCreationPolicy`) |
| `POST /api/administration/roles` | `admin.role.write` et droit de délégation |
| `GET /api/administration/members` | `admin.member.read` ou `admin.member.write` |
| `POST /api/administration/members` | `admin.member.write` et `admin.role-assignment.write` |
| `PUT /api/administration/services` | `admin.service.write` |
| `POST /api/administration/services/availability` | `admin.service.disable` |
| `GET /api/citizen/accounts` | `admin.citizen.read` ou `admin.citizen.write` ; données sensibles : `admin.sensitive-data.read` + `?reveal=1` |
| `PUT /api/citizen/accounts/suspension` | `admin.citizen.write` |
| `GET /api/citizen/agent/requests` | `admin.request.read` ; lieu des demandes de contact : `admin.sensitive-data.read` + `?reveal=1` |
| `POST /api/citizen/agent/requests/status` | `admin.request.read` + `admin.request.write` |
| `GET /api/citizen/agent/appointments` | `admin.request.read` ; téléphone : `admin.sensitive-data.read` + `?reveal=1` |
| `POST /api/citizen/agent/appointment-slots`, `…/remove` | `admin.request.read` + `admin.request.write` |
| `GET /api/citizen/agent/concerns`, `POST …/handle` | `admin.request.read` (+ `admin.request.write` pour répondre) |
| `GET /api/communication/manage/*`, `PUT /api/communication/manage/*` | `admin.communication.write` |
| `GET /api/pilotage/webcup-feed`, `GET /api/pilotage/activity`, `PUT /api/pilotage/tracking/{code}` | `admin.pilotage.read` (+ `admin.pilotage.write` pour le suivi) |
| `GET /api/audit/entries` | `admin.audit.read` (lignes de connexion : `admin.security.read`) |
| `GET /api/iam/security/login-events` | `admin.security.read` |


Les erreurs contractuelles `AccountAlreadyExists` et `AccountCreationRejected` appartiennent à Administration ; l’adaptateur IAM y traduit ses propres erreurs.

## Cible retenue

- Suppression ou archivage d’un service du catalogue ; ordre de mise en avant choisi par les agents.
- Gestion de la liste des quartiers par les agents (aujourd’hui fixée dans `Domain/VO/District`).
- Modification, suspension des membres ; modification et suppression des rôles.
- Rattachement d’un compte IAM **existant** lors de l’ajout d’un membre (aujourd’hui refusé).

## Questions ouvertes

- Permissions des agents sur Citizen : contexte `admin` ou contexte `citizen` dédié ? Le contrôle `AddMember` n’accepte aujourd’hui que des rôles du contexte `admin`.

## Référence

- [Membres et habilitations](membres-et-habilitations.md)
- [Initialisation de l’administrateur principal](initialisation-admin.md)
- [Architecture](../../../../doc/technique/architecture.md) · [ADR 003 — Identité et habilitations](../../../../doc/technique/decisions/003-identite-et-habilitations.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [API](../../../README.md)
- [IAM](../../IAM/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [ADR 003](../../../../doc/technique/decisions/003-identite-et-habilitations.md)
- [Citizen](../../Citizen/doc/README.md)
- [Communication](../../Communication/doc/README.md)
- [Admin — contenus](../../../../front/apps/admin/doc/contenus.md)
- [Pilotage](../../Pilotage/doc/README.md)
- [Membres et habilitations](membres-et-habilitations.md)
- [Admin — membres](../../../../front/apps/admin/doc/membres.md)
- [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)
- [Site — vitrine et alertes](../../../../front/apps/site/doc/vitrine-et-alertes.md)
- [ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md)
<!-- backlinks:end -->
