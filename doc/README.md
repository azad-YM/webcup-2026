# Documentation transverse

<!-- navigation:start -->
[Accueil du projet](../README.md) › Documentation
<!-- navigation:end -->

La racine `doc` contient le contexte produit, l’architecture, les décisions transverses et le suivi du chantier. Les règles, cas d’usage et contrats de chaque module résident dans le dossier `doc` de son BC ou sous-domaine. Les parcours d’interface sont dans le `doc` de chaque application.

Pour comprendre une fonctionnalité, partir de l’application qui la présente ([site](../front/apps/site/doc/README.md), [admin](../front/apps/admin/doc/README.md)), puis suivre ses liens vers les BC propriétaires.

## Produit et suivi

- [Contexte produit — Nova Terra](contexte/README.md) : utilisateurs, carte des modules, API du concours Webcup
- [Chantier](chantier/README.md) : lots, prochaines tâches, [registre des demandes](chantier/demandes.md)

## Architecture et décisions

- [Architecture technique](technique/architecture.md)
- [Décisions transverses (ADR)](technique/decisions/README.md)

## Documentation locale (API)

- [IAM](../api/src/IAM/doc/README.md) : comptes, connexion, passage site → admin, espaces
- [Administration](../api/src/Administration/doc/README.md) : membres, rôles, permissions ; services et publications (cible)
- [Citizen](../api/src/Citizen/doc/README.md) : citoyens et demandes (cible, code à créer)
- [Pilotage](../api/src/Pilotage/doc/README.md) : flux de l’API du concours Webcup pour les agents
- [Shared](../api/src/Shared/doc/README.md) : primitives et conventions communes

## Applications

- [site](../front/apps/site/doc/README.md) : portail des habitants (connexion livrée, espace citoyen à construire)
- [admin](../front/apps/admin/doc/README.md) : espace de travail des agents et des administrateurs (membres, rôles, flux Nova Terra)

## Maintenance

Lire le `doc/README.md` local avant toute modification. Mettre à jour la règle à sa source, dans le même changement que son comportement. Référencer une règle externe par un lien, sans la recopier. Une décision locale reste dans le doc de son propriétaire ; seule une décision qui traverse les périmètres rejoint les ADR centraux. Mettre à jour le [chantier](chantier/README.md) à chaque livraison.

<!-- backlinks:start -->
---

[← Retour à l’accueil du projet](../README.md)

**Référencé depuis :**

- [API](../api/README.md)
- [Architecture transverse](technique/README.md)
- [Contexte produit](contexte/README.md)
- [Chantier](chantier/README.md)
<!-- backlinks:end -->
