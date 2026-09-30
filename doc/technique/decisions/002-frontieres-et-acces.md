# ADR 002 — Frontières entre modules et architecture des accès

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 002
<!-- navigation:end -->

- Statut : accepté
- Date : 2026-09-30

## Contexte

Le socle doit accueillir plusieurs domaines métier et plusieurs applications authentifiées sans que les modules se couplent par leurs repositories, entités ou handlers, ni que l’authentification soit dupliquée dans chaque application.

## Décision

### Frontières

1. Le consommateur définit le port dont son cas d’usage a besoin dans sa couche Application, avec ses DTO et erreurs contractuelles.
2. Le fournisseur implémente ce port dans sa propre Infrastructure (`Infrastructure/Adapter/<Consommateur>`) en appelant ses propres cas d’usage.
3. La composition (Symfony `services.yaml`, kernel frontend) injecte l’adaptateur derrière le port.

Interdits : SQL sur les tables d’un autre module, association ORM entre agrégats de modules différents, import d’entité/handler/repository étranger dans le consommateur, service locator. `Shared` ne sert pas à contourner un propriétaire.

### Accès

- Le BC `IAM` possède l’identité de connexion (compte, e-mail, secret haché, JWT, codes de portail) et l’administration des accès de l’espace `admin` (membres, rôles, catalogue de permissions).
- Un futur BC qui expose son propre espace peut déterminer ses membres et rôles ; il les fournit à IAM via `AccessibleSpacesProvider`.
- IAM compose les espaces accessibles via le port `AccessibleSpacesProvider` que chaque fournisseur implémente et étiquette `iam.accessible_spaces`.
- Le site porte le seul formulaire de connexion ; les applications reçoivent un code à usage unique (60 s max) lié à la destination et à un challenge PKCE, échangé contre un JWT d’audience dédiée.
- L’affichage d’un espace ne vaut pas autorisation : chaque opération est contrôlée par son BC (ex. `ItemAccessPolicy` pour `Example`).

## Conséquences

- Ajouter un domaine = ajouter un BC avec ses ports ; ajouter une application = ajouter une audience JWT, une destination de portail et un fournisseur d’espace.
- Les tests unitaires du consommateur utilisent un double du port ; les tests applicatifs vérifient le raccordement réel avec l’adaptateur fournisseur.
- La révocation commune des sessions reste à concevoir (voir [décisions à instruire](README.md)).

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [Architecture technique](../architecture.md)
- [Documentation — IAM](../../../api/src/IAM/doc/README.md)
<!-- backlinks:end -->
