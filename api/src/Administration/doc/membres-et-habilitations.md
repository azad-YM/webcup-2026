# Membres et habilitations

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Administration](README.md) › Membres et habilitations
<!-- navigation:end -->

## Modèle

- **Permission** : triplet `context.resource.action` (actions : `read`, `write`, `delete`, `approve`, `reject`, `execute`).
- **Catalogue** (`Infrastructure/InMemory/InMemoryAdminPermissionRepository`, étiquette `administration.permissions`) : `admin.role.read`, `admin.role.write`, `admin.member.write`, `admin.role-assignment.write`.
- **Rôle** : nom + liste de permissions (table `roles`).
- **Membre** : référence un compte [IAM](../../IAM/doc/README.md) (`userId`, sans association ORM), porte des `roleIds` et un statut actif (table `admin_members`, un membre par compte).

Les droits d’un membre sont l’union des permissions de ses rôles ; un membre inactif n’a aucun droit.

## Règles des cas d’usage

| Cas d’usage | Autorisation requise | Règles |
|---|---|---|
| Lister les permissions | `admin.role.read` ou `admin.role.write` | Retourne le catalogue complet. |
| Créer un rôle | `admin.role.write` **et** `admin.role-assignment.write` | Nom non vide (trimé) ; chaque permission doit exister dans le catalogue ; sinon 422 sans sauvegarde. |
| Ajouter un membre | `admin.member.write` **et** `admin.role-assignment.write` | Au moins un rôle, sans doublon ; rôles existants et limités au contexte `admin` ; compte IAM créé via le port `MemberAccountProvisioner` avec le mot de passe initial (8–72 octets) ; e-mail existant refusé ; `MemberCreated` publié sans le mot de passe. |
| Vérifier les permissions courantes | — (query interne) | Vrai seulement si le membre courant est actif et possède toutes les permissions demandées. |
| Accès à l’espace `admin` | — (fourni à IAM par `AdminAccessibleSpacesProvider`) | Tout membre actif ; retourne les noms de ses rôles. |

Refus d’autorisation → 403 ; règle métier ou payload invalide → 422 ; toute la mutation est annulée (transaction `command.bus`).

## Politiques fournies aux autres BC

| Port consommateur | Adaptateur | Permissions |
|---|---|---|
| `Citizen\…` (cible) | `Adapter/Citizen/…` | à définir |

Initialisation du premier administrateur : [procédure CLI](initialisation-admin.md).

<!-- backlinks:start -->
---

[← Retour à Administration](README.md)

**Référencé depuis :**

- [Admin — rôles](../../../../front/apps/admin/doc/roles.md)
- [Initialisation de l’administrateur](initialisation-admin.md)
- [Administration](README.md)
- [IAM — comptes et sessions](../../IAM/doc/comptes-et-sessions.md)
<!-- backlinks:end -->
