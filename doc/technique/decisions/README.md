# Décisions d’architecture

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › Décisions
<!-- navigation:end -->

Les décisions structurantes sont consignées sous forme d’ADR (*Architecture Decision Record*).

## Décisions acceptées

- [ADR 001 — Utiliser MySQL](001-mysql.md)
- [ADR 002 — Frontières entre modules et architecture des accès](002-frontieres-et-acces.md)
- [ADR 003 — Séparer l’identité des profils et habilitations métier](003-identite-et-habilitations.md)
- [ADR 004 — Temps réel derrière un port : SSE maison sur la base de données, fournisseur interchangeable](004-temps-reel.md)
- [ADR 005 — Un BC Communication pour les publications et les alertes](005-bc-communication.md)
- [ADR 006 — Journal des actions : un BC Audit alimenté par un port Shared `AuditTrail`](006-journal-des-actions.md)
- [ADR 007 — Protection des données : durcissement transverse et accès fins aux données sensibles](007-protection-des-donnees.md)
- [ADR 008 — Un BC Participation pour les projets, les consultations et la boîte à idées](008-bc-participation.md)

## Format recommandé

Chaque décision indique : le contexte, les options étudiées, la décision, ses conséquences, son statut et sa date.

## Décisions à instruire selon le produit

1. Révocation et déconnexion communes des sessions entre applications.
2. Rétention de l’audit (la journalisation est tranchée par l’[ADR 006](006-journal-des-actions.md)), stratégie de notifications et de conservation des données (les alertes aux habitants des demandes D18, F29, F30 et F31 obligent à trancher la partie notifications ; la diffusion dans l’application est tranchée par l’[ADR 004](004-temps-reel.md), l’e-mail reste ouvert).
3. Outbox si le transport Messenger quitte la base applicative.

L’inscription publique est tranchée : elle est portée par [Citizen](../../../api/src/Citizen/doc/README.md#décisions-retenues). La route historique `/api/auth/register` a été retirée lors de la livraison de `POST /api/citizen/register`.

Une décision ouverte ne doit pas être présentée ailleurs comme validée.

<!-- backlinks:start -->
---

[← Retour à Architecture](../README.md)

**Référencé depuis :**

- [IAM — comptes et sessions](../../../api/src/IAM/doc/comptes-et-sessions.md)
- [ADR 003](003-identite-et-habilitations.md)
- [ADR 004](004-temps-reel.md)
- [ADR 005](005-bc-communication.md)
- [ADR 006](006-journal-des-actions.md)
- [ADR 007](007-protection-des-donnees.md)
- [ADR 008](008-bc-participation.md)
<!-- backlinks:end -->
