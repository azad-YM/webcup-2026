# ADR 005 — Un BC Communication pour les publications et les alertes

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 005
<!-- navigation:end -->

- Statut : accepté, BC à construire (lots L3 et L7)
- Date : 2026-10-03
- Précise : [ADR 003](003-identite-et-habilitations.md), qui plaçait les publications dans Administration

## Contexte

Les publications (D06) et les alertes (D18, F29, F30, F31) étaient prévues dans Administration. Administration répond à « qui travaille pour la ville et que peut-il faire ? ». Les publications et les alertes répondent à une autre question : « quelle information la ville adresse-t-elle aux habitants, à qui, quand et avec quelle importance ? ». Elles ont leur propre cycle de vie (brouillon, publiée, expirée, retirée), une audience et une gravité.

## Décision

Créer un BC `Communication`, propriétaire de :

- **Publication** : actualité, annonce, changement de service, information pratique (D06) ; une publication peut être marquée importante (F30) ;
- **Alerte** : information urgente avec gravité (`info`, `warning`, `critical`), période de validité et audience (D18, F29) ;
- **Recommandations** rattachées à une alerte, éventuellement par audience (F31) ; ce n’est pas un type de communication à part ;
- **Audience** : tous les habitants, un quartier, les personnes ayant consenti aux alertes sanitaires.

Raccordements prévus, selon la règle des ports :

| Consommateur (port) | Fournisseur (adaptateur) | Besoin |
|---|---|---|
| Communication — politique d’accès | Administration | L’agent a-t-il la permission de publier ? |
| Communication — audience d’un citoyen | Citizen | Quartier et consentement du citoyen connecté |

Un agent crée une alerte depuis l’admin : il n’y a pas d’événement « urgence détectée » émis par Administration. Communication publie ses propres événements (`AlertPublished`…) et, par un handler applicatif, les pousse en temps réel ([ADR 004](004-temps-reel.md)). Communication n’est pas un bus d’événements générique : un changement de statut de demande est publié par son BC propriétaire.

Le catalogue des **services municipaux** (D05, F28, F32) reste dans Administration.

## Conséquences

- Les alertes actives sont lisibles par une requête (bandeau du site, espace personnel) ; le temps réel ne fait qu’accélérer leur apparition.
- Le BC sera créé sur le modèle d’Administration (autoload, services, routes, mapping, suite PHPUnit, `doc`, `AGENTS.md`) au premier lot qui en a besoin.
- Questions ouvertes reprises du [chantier](../../chantier/README.md) : liste fermée des quartiers, notifications par e-mail, consentement pour les alertes sanitaires.

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [ADR 004](004-temps-reel.md)
- [ADR 003](003-identite-et-habilitations.md)
- [Architecture technique](../architecture.md)
- [Contexte produit](../../contexte/README.md)
- [Chantier](../../chantier/README.md)
- [Documentation — Administration](../../../api/src/Administration/doc/README.md)
- [Documentation](../../README.md)
- [Site](../../../front/apps/site/doc/README.md)
- [Admin](../../../front/apps/admin/doc/README.md)
<!-- backlinks:end -->
