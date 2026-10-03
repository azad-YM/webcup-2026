# Documentation — Administration

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Administration
<!-- navigation:end -->

Administration est le BC de l’**organisation municipale de Nova Terra**. Il répond à « qui travaille pour la ville et que peut-il faire ? » : il porte les membres de l’administration (agents, administrateurs), leurs rôles et le catalogue des permissions. Il décide de l’accès à l’espace de travail `admin` et autorise les opérations sensibles des autres BC. Il portera aussi le catalogue des services municipaux (cible). Les publications et les alertes appartiennent au BC Communication ([ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)), qui consultera Administration pour autoriser les agents.

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

## Livré

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/administration/permissions` | Catalogue des permissions |
| GET | `/api/administration/roles` | Liste des rôles `{id, name, permissions[]}` |
| POST | `/api/administration/roles` | Création d’un rôle |
| GET | `/api/administration/members` | Liste des membres `{id, userId, name, roles[{id, name}], active}` |
| POST | `/api/administration/members` | Ajout d’un membre et création de son compte IAM |

CLI : `php bin/console app:admin:bootstrap` ([initialisation de l’administrateur principal et des rôles de référence](initialisation-admin.md)).

Interface : la page [Membres](../../../../front/apps/admin/doc/membres.md) de l’admin liste les membres et ajoute un membre ; la page [Rôles](../../../../front/apps/admin/doc/roles.md) crée les rôles.

## Ports et raccordements

| Sens | Port (propriétaire) | Adaptateur (fournisseur) |
|---|---|---|
| Administration consomme IAM | `Application/Ports/Provider/CurrentAccountProvider` | `IAM/Infrastructure/Adapter/Administration/IAMCurrentAccountProvider` |
| Administration consomme IAM | `Application/Ports/Provider/MemberAccountProvisioner` | `IAM/Infrastructure/Adapter/Administration/IAMMemberAccountProvisioner` |
| IAM consomme Administration | `IAM\…\AccessibleSpacesProvider` | `Infrastructure/Adapter/IAM/AdminAccessibleSpacesProvider` |
| Pilotage consomme Administration | `Pilotage\Application\Ports\Provider\PilotageAccessPolicy` | `Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` (`admin.pilotage.read`) |
| Citizen consomme Administration | `Citizen\Application\Ports\Provider\RequestAccessPolicy` | `Infrastructure/Adapter/Citizen/AdminRequestAccessPolicy` (`admin.request.read` ; traitement : `admin.request.read` + `admin.request.write`) |
| Shared (flux temps réel) consomme Administration | `Shared\Application\Ports\Provider\RealtimeAudienceProvider` (tag automatique) | `Infrastructure/Adapter/Shared/AdminRequestsRealtimeAudience` : topic `administration.requests` pour `admin.request.read` |

Les deux adaptateurs s’appuient sur les requêtes internes `CheckCurrentMemberPermissions` (compte connecté) et `CheckMemberPermissions` (compte donné, utilisé par le flux temps réel) : membre actif, union des permissions de ses rôles.

Les erreurs contractuelles `AccountAlreadyExists` et `AccountCreationRejected` appartiennent à Administration ; l’adaptateur IAM y traduit ses propres erreurs.

## Cible retenue

- **Services municipaux** : catalogue présenté aux habitants, avec mise en avant des services prioritaires (D05, F28).
- **Autorisation des publications et alertes** : adaptateur de la politique d’accès de Communication (D06, D18, F29, F30, F31 ; [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)).
- **Recherche et filtres** dans le catalogue des services (F32).
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
- [Pilotage](../../Pilotage/doc/README.md)
- [Membres et habilitations](membres-et-habilitations.md)
- [Admin — membres](../../../../front/apps/admin/doc/membres.md)
- [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)
<!-- backlinks:end -->
