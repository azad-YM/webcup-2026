# Décisions d’architecture

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › Décisions
<!-- navigation:end -->

Les décisions structurantes sont consignées sous forme d’ADR (*Architecture Decision Record*).

## Décisions acceptées

- [ADR 001 — Utiliser MySQL](001-mysql.md)
- [ADR 002 — Frontières entre modules et architecture des accès](002-frontieres-et-acces.md)

## Format recommandé

Chaque décision indique : le contexte, les options étudiées, la décision, ses conséquences, son statut et sa date.

## Décisions à instruire selon le produit

1. Révocation et déconnexion communes des sessions entre applications.
2. Politique d’inscription publique (route `/api/auth/register` conservée).
3. Stratégie d’audit, de notifications et de conservation des données.
4. Outbox si le transport Messenger quitte la base applicative.

Une décision ouverte ne doit pas être présentée ailleurs comme validée.

<!-- backlinks:start -->
---

[← Retour à Architecture](../README.md)

**Référencé depuis :**

- [IAM — comptes et sessions](../../../api/src/IAM/doc/comptes-et-sessions.md)
<!-- backlinks:end -->
