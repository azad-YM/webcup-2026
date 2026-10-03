# Création des rôles

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Création des rôles
<!-- navigation:end -->

Les administrateurs créent un rôle en lui donnant un nom et en sélectionnant ses permissions. Point d’entrée : `/admin/role`.

## Parcours livré

Le formulaire charge le catalogue depuis l’API. La recherche porte sur les libellés et les codes, sans distinction de casse ou d’accent ; le filtre propose les contextes du catalogue. Changer de filtre conserve les cases cochées ; seules les permissions encore présentes dans le catalogue sont envoyées. Les états chargement, catalogue vide, recherche sans résultat, erreur et succès sont distincts ; la soumission est bloquée pendant l’envoi.

## Contrats et composition

Règles : [Administration — membres et habilitations](../../../../api/src/Administration/doc/membres-et-habilitations.md). Routes : `GET /api/administration/permissions`, `POST /api/administration/roles`. Chaîne : formulaire → RTK Query (`accessManagementApi`) → use cases → `PermissionGateway` / `RoleHttpGateway` (`admin/core/infrastructure/for-production/gateway/http`). Le kernel injecte `AuthAccessSessionProvider`, adaptateur du module `auth` pour le port `AccessSessionProvider` du module `admin`.

Un 401 invalide la session et vide le store ; un 403 ou une panne réseau conserve la session. La création exige `admin.role.write` et `admin.role-assignment.write`.

## Limites

Liste, modification et suppression des rôles ne sont pas livrées.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [Administration — membres et habilitations](../../../../api/src/Administration/doc/membres-et-habilitations.md)
<!-- backlinks:end -->
