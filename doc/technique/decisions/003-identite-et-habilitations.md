# ADR 003 — Séparer l’identité (IAM) des profils et habilitations métier

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 003
<!-- navigation:end -->

- Statut : accepté
- Date : 2026-10-03
- Précise : [ADR 002](002-frontieres-et-acces.md), section « Accès »

## Contexte

Le socle plaçait dans IAM à la fois l’identité (comptes, sessions) et l’administration des accès (membres, rôles, permissions) ; le modèle `Role` résidait dans le Shared global. La plateforme Nova Terra distingue trois profils rattachés à un même compte possible : citoyen, agent municipal, administrateur. Les règles de ces profils relèvent du métier de la ville, pas de l’authentification.

## Options étudiées

1. Garder membres et rôles dans IAM, ajouter les citoyens ailleurs.
2. IAM reçoit toute création (citoyen ou membre), crée le compte, puis appelle le BC métier pour créer le profil.
3. Chaque BC métier porte la création de son profil et demande le compte à IAM via son propre port.

L’option 2 rend IAM dépendant de ses consommateurs et lui fait connaître les notions de citoyen et de membre.

## Décision

Option 3.

- **IAM** : comptes, login JWT, audiences, codes de portail, agrégation des espaces. Il ne connaît aucun profil métier.
- **Administration** : membres de l’administration, rôles, catalogue de permissions, accès à l’espace `admin`, autorisation des opérations des autres BC. Cible : services municipaux ; les publications et alertes relèvent désormais de Communication ([ADR 005](005-bc-communication.md)).
- **Citizen** : citoyens et demandes citoyennes.
- Un profil métier référence le compte par `userId`, sans association ORM.
- La création « compte + profil » est un cas d’usage du BC métier ; il appelle son port de création de compte, implémenté dans `IAM/Infrastructure/Adapter/<BC>`, dans la transaction de `command.bus`.
- Si l’e-mail existe déjà : un administrateur peut rattacher le compte existant à un membre ; l’inscription publique d’un citoyen est refusée avec une invitation à se connecter.

## Conséquences

- Membres, rôles, permissions, bootstrap CLI et tests ont été déplacés d’IAM et de Shared vers `api/src/Administration` ; les routes sont désormais `/api/administration/{permissions,roles,members}`.
- La dette « `Role` dans Shared » est résorbée.
- Les tables `roles` et `admin_members` sont conservées sans migration.
- L’exception de la CLI d’initialisation est déplacée dans Administration et continue de composer l’entité IAM `User`.
- Le gabarit `Example` (API, module admin, permissions `admin.item.*`) a été retiré le 2026-10-03. La migration `Version20261003000100` supprime la table `example_items`. `Administration` sert désormais de modèle aux nouveaux BC.
- Le BC des citoyens s’appelle `Citizen`. L’inscription y crée le compte et le citoyen en une seule fois, sans statut de vérification ; le profil personnel est facultatif.

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [Architecture technique](../architecture.md)
- [ADR 005](005-bc-communication.md)
- [ADR 002](002-frontieres-et-acces.md)
- [Documentation — IAM](../../../api/src/IAM/doc/README.md)
- [Documentation — Administration](../../../api/src/Administration/doc/README.md)
- [Documentation — Citizen](../../../api/src/Citizen/doc/README.md)
- [Décisions](README.md)
<!-- backlinks:end -->
