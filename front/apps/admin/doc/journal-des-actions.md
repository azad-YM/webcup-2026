# Journal des actions

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Journal des actions
<!-- navigation:end -->

Les agents et administrateurs retrouvent qui a fait quoi, quand et sur quoi dans l’administration (lot L12, F47 et F48). Point d’entrée : `/admin/journal`, entrée « Journal des actions » de la barre latérale du module Administration.

## Parcours livré (non testé, non vérifié dans un navigateur)

1. Liste chronologique, de la plus récente à la plus ancienne (200 lignes au plus) : catégorie, type d’action en clair, date et heure, résumé, acteur (« Par »), cible (« Sur »). « Détail » déplie le contexte (états avant/après, gravité, rôles…).
2. Filtres : recherche libre (nom, référence, titre), acteur, type d’action, période (du / au, jours inclus). « Effacer les filtres » et « Actualiser ».
3. États distincts : chargement, journal vide, aucun résultat pour les filtres, erreur avec « Réessayer » (403 : permission `admin.audit.read` manquante ; 422 : dates invalides). Un 401 invalide la session.
4. L’agent municipal voit le journal sans les connexions bloquées (réservées à `admin.security.read`).

## Contrats et composition

Route et règles : [Audit](../../../../api/src/Audit/doc/README.md) (`GET /api/audit/entries`) ; décision : [ADR 006](../../../../doc/technique/decisions/006-journal-des-actions.md).

Chaîne : `AuditJournalPage` → RTK Query (`auditApi.auditEntries`) → use case `listAuditEntries` → port `AuditJournalGateway` → `AuditJournalHttpGateway`. Session : port `AuditSessionProvider` du module `audit`, implémenté par `AuthAuditSessionProvider` (`auth/core/infrastructure/adapter/audit`). Libellés des actions : `audit/core/domain/audit-entry.ts`.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [Audit](../../../../api/src/Audit/doc/README.md)
<!-- backlinks:end -->
