# Documentation transverse

<!-- navigation:start -->
[Accueil du projet](../README.md) › Documentation
<!-- navigation:end -->

La racine `doc` contient uniquement l’architecture et les décisions transverses. Les règles, cas d’usage et contrats de chaque module résident dans le dossier `doc` de son BC ou sous-domaine ; les parcours d’interface dans le `doc` de chaque application.

Pour comprendre une fonctionnalité, partir de l’application qui la présente ([site](../front/apps/site/doc/README.md), [admin](../front/apps/admin/doc/README.md)), puis suivre ses liens vers les BC propriétaires.

## Architecture et décisions

- [Architecture technique](technique/architecture.md)
- [Décisions transverses (ADR)](technique/decisions/README.md)

## Documentation locale (API)

- [IAM](../api/src/IAM/doc/README.md) — comptes, authentification, espaces, membres, rôles, permissions
- [Example](../api/src/Example/doc/README.md) — BC d’exemple à dupliquer
- [Shared](../api/src/Shared/doc/README.md) — primitives et conventions communes

## Applications

- [site](../front/apps/site/doc/README.md) — connexion unique et choix de l’espace
- [admin](../front/apps/admin/doc/README.md) — administration et module d’exemple

## Maintenance

Lire le `doc/README.md` local avant toute modification. Mettre à jour la règle à sa source, dans le même changement que son comportement. Référencer une règle externe par lien, sans la recopier. Une décision locale reste dans le doc de son propriétaire ; seule une décision qui traverse les périmètres rejoint les ADR centraux.

<!-- backlinks:start -->
---

[← Retour à l’accueil du projet](../README.md)

**Référencé depuis :**

- [API](../api/README.md)
- [Architecture transverse](technique/README.md)
<!-- backlinks:end -->
