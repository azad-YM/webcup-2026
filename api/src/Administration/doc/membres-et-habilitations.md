# Membres et habilitations

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Administration](README.md) › Membres et habilitations
<!-- navigation:end -->

## Modèle

- **Permission** : triplet `context.resource.action` (actions : `read`, `write`, `delete`, `approve`, `reject`, `execute`).
- **Catalogue** (`Infrastructure/InMemory/InMemoryAdminPermissionRepository`, étiquette `administration.permissions`) : `admin.role.read`, `admin.role.write`, `admin.member.read`, `admin.member.write`, `admin.role-assignment.write`, `admin.pilotage.read`, `admin.request.read` (file des demandes citoyennes), `admin.request.write` (traitement des demandes).
- **Rôle** : nom + liste de permissions (table `roles`).
- **Membre** : référence un compte [IAM](../../IAM/doc/README.md) (`userId`, sans association ORM), porte des `roleIds` et un statut actif (table `admin_members`, un membre par compte).

Les droits d’un membre sont l’union des permissions de ses rôles ; un membre inactif n’a aucun droit.

## Rôles de référence

Créés ou resynchronisés par la [CLI d’initialisation](initialisation-admin.md) :

| Identifiant | Nom | Permissions |
|---|---|---|
| `principal-administrator` | Administrateur principal | tout le catalogue |
| `municipal-agent` | Agent municipal | `admin.pilotage.read`, `admin.request.read`, `admin.request.write` |

Un administrateur attribue le rôle « Agent municipal » depuis la page Membres de l’admin.

## Règles des cas d’usage

| Cas d’usage | Autorisation requise | Règles |
|---|---|---|
| Lister les permissions | `admin.role.read` ou `admin.role.write` | Retourne le catalogue complet. |
| Lister les rôles | `admin.role.read` ou `admin.role.write` | Tous les rôles triés par nom, avec leurs permissions (`{context, resource, action}`). |
| Lister les membres | `admin.member.read` ou `admin.member.write` | Tous les membres triés par nom, avec le nom de leurs rôles et leur statut ; un rôle supprimé n’est plus affiché. |
| Créer un rôle | `admin.role.write` **et** `admin.role-assignment.write` | Nom non vide (trimé) ; chaque permission doit exister dans le catalogue ; sinon 422 sans sauvegarde. |
| Ajouter un membre | `admin.member.write` **et** `admin.role-assignment.write` | Au moins un rôle, sans doublon ; rôles existants et limités au contexte `admin` ; compte IAM créé via le port `MemberAccountProvisioner` avec le mot de passe initial (8–72 octets) ; e-mail existant refusé ; `MemberCreated` publié sans le mot de passe. |
| Vérifier les permissions courantes | — (query interne) | Vrai seulement si le membre courant est actif et possède toutes les permissions demandées. |
| Accès à l’espace `admin` | — (fourni à IAM par `AdminAccessibleSpacesProvider`) | Tout membre actif ; retourne les noms de ses rôles. |

Refus d’autorisation → 403 ; règle métier ou payload invalide → 422 ; toute la mutation est annulée (transaction `command.bus`).

## Politiques fournies aux autres BC

| Port consommateur | Adaptateur | Permissions |
|---|---|---|
| [Pilotage](../../Pilotage/doc/README.md) — `PilotageAccessPolicy` | `Adapter/Pilotage/AdminPilotageAccessPolicy` | `admin.pilotage.read` (membre actif) |
| [Citizen](../../Citizen/doc/README.md) — `RequestAccessPolicy` | `Adapter/Citizen/AdminRequestAccessPolicy` | lecture : `admin.request.read` ; traitement : `admin.request.read` + `admin.request.write` (membre actif) |
| [Shared](../../Shared/doc/README.md) — `RealtimeAudienceProvider` | `Adapter/Shared/AdminRequestsRealtimeAudience` | topic `administration.requests` : `admin.request.read` (membre actif) |

Initialisation du premier administrateur : [procédure CLI](initialisation-admin.md).

<!-- backlinks:start -->
---

[← Retour à Administration](README.md)

**Référencé depuis :**

- [Admin — rôles](../../../../front/apps/admin/doc/roles.md)
- [Admin — membres](../../../../front/apps/admin/doc/membres.md)
- [Initialisation de l’administrateur](initialisation-admin.md)
- [Administration](README.md)
- [IAM — comptes et sessions](../../IAM/doc/comptes-et-sessions.md)
- [Pilotage](../../Pilotage/doc/README.md)
- [Citizen](../../Citizen/doc/README.md)
<!-- backlinks:end -->
