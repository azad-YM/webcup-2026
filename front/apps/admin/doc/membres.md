# Membres de l’administration

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Membres
<!-- navigation:end -->

Les administrateurs consultent les agents et administrateurs de Nova Terra et en ajoutent de nouveaux, avec leurs rôles. Point d’entrée : `/admin/member` (menu Configuration › Membres).

## Parcours livré

1. La liste charge les membres : nom, rôles, statut actif ou inactif. États distincts : chargement, liste vide, erreur avec « Réessayer ». Un refus (403) affiche « Vous n’avez pas les droits nécessaires pour cette opération » sans déconnecter.
2. Le formulaire « Ajouter un membre » demande le nom, l’e-mail, le mot de passe initial (8 à 72 octets, jamais réaffiché) et au moins un rôle. Les rôles proviennent de la liste des rôles ; seuls ceux limités au contexte `admin` sont proposés, comme l’exige l’API. Sans rôle attribuable, un lien mène à la création de rôle.
3. Pendant l’envoi, les champs et le bouton sont désactivés et une garde empêche la double soumission. En cas de succès, le formulaire est vidé et la liste est rechargée (invalidation du tag RTK `Members`). Un refus 422 (e-mail déjà utilisé, mot de passe ou rôle invalide) conserve la saisie et affiche un message explicite.

Le rôle « Agent municipal » créé par l’[initialisation](../../../../api/src/Administration/doc/initialisation-admin.md) permet d’ajouter un agent depuis cette page.

## Contrats et composition

Règles et permissions : [Administration — membres et habilitations](../../../../api/src/Administration/doc/membres-et-habilitations.md). Routes : `GET /api/administration/members` (`admin.member.read` ou `admin.member.write`), `POST /api/administration/members` (`admin.member.write` et `admin.role-assignment.write`), `GET /api/administration/roles` (`admin.role.read` ou `admin.role.write`).

Chaîne : `MembersPage` → sections `member-list` et `member-form` → RTK Query (`accessManagementApi` : `listMembers`, `addMember`, `listRoles`) → use cases → ports `MemberGateway` / `RoleGateway` → `MemberHttpGateway` / `RoleHttpGateway` (`admin/core/infrastructure/for-production/gateway/http`). Session : port `AccessSessionProvider` du module `admin`, implémenté par `AuthAccessSessionProvider` du module `auth`.

Tests : `member.http.test.ts` (contrats HTTP, invalidation du cache après création, refus 403/422/500), `assignable-roles.test.ts` (rôles proposés, longueur du mot de passe).

## Limites

Pas de modification, suspension ni suppression d’un membre ; pas de rattachement d’un compte IAM existant (un e-mail déjà utilisé est refusé).

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
- [Administration — membres et habilitations](../../../../api/src/Administration/doc/membres-et-habilitations.md)
<!-- backlinks:end -->
