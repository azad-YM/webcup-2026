# ADR 006 — Journal des actions : un BC Audit alimenté par un port Shared `AuditTrail`

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 006
<!-- navigation:end -->

- Statut : accepté, BC créé (lot L12 — [documentation](../../../api/src/Audit/doc/README.md))
- Date : 2026-10-03
- Tranche en partie : la « stratégie d’audit » listée parmi les décisions à instruire

## Contexte

F47 et F48 demandent de retrouver « qui a fait quoi, quand, sur quoi » dans l’administration : rôles, membres, services, publications, alertes, demandes citoyennes, comptes, connexions bloquées. Ces actions appartiennent à cinq BC différents. Il faut une trace fiable (une action acceptée a toujours sa ligne, une action refusée n’en a pas), consultable en un seul écran, sans que chaque BC lise les tables des autres.

## Options étudiées

1. **Écouter les événements de domaine** (`MemberCreated`, `AlertPublished`…) dans un BC Audit. Rejeté : les événements partent sur le transport `async`, donc sans le compte connecté ; beaucoup d’actions n’ont pas d’événement (rôle, service, suspension) ; les événements portent peu de contexte.
2. **Un journal par BC** et une agrégation par ports. Rejeté : cinq tables, cinq requêtes paginées à fusionner, filtres transverses coûteux.
3. **Port `AuditTrail` dans Shared, implémenté par un BC `Audit`** et appelé par le cas d’usage du BC propriétaire. Retenu.

## Décision

- `Shared/Application/Ports/Service/AuditTrail::record(action, targetType, targetId, summary, details, actorLabel?)` est une primitive technique commune, comme `RealtimePublisher`. Shared ne dépend d’aucun BC.
- Le BC `Audit` possède la table `audit_entries` (journal en ajout seul), l’implémente dans `Audit/Infrastructure/Adapter/Shared/AuditTrailRecorder` et expose la lecture `GET /api/audit/entries`.
- Chaque BC propriétaire appelle le port **dans son handler**, après ses contrôles et la sauvegarde : l’écriture (DBAL) rejoint la transaction du `command.bus`. Action refusée ou annulée → aucune ligne ; action validée → ligne garantie. Les codes d’action suivent `<bc>.<ressource>.<verbe>` (ex. `communication.alert.published`).
- L’acteur est résolu par Audit via son port `AuditActorProvider` (adaptateur IAM : nom du compte, sinon e-mail). Une action anonyme (connexion bloquée) fournit son propre libellé.
- Lecture : port `AuditAccessPolicy` implémenté par Administration. `admin.audit.read` ouvre le journal ; les lignes `iam.login.*` (e-mail, IP) restent réservées à `admin.security.read`, comme le journal de sécurité.
- **Agent municipal** : reçoit `admin.audit.read` (F47 vise explicitement les agents), sans `admin.security.read` ; il voit donc tout sauf les connexions bloquées.

## Conséquences

- Le paramètre `?AuditTrail $audit = null` est ajouté **en dernier** aux handlers concernés ; les tests unitaires existants restent valides sans double, le conteneur injecte l’adaptateur. Un nouveau cas d’usage de mutation de l’administration doit appeler le port.
- Pas de rétention automatique pour l’instant ; pas d’export. Les lignes ne sont ni modifiables ni supprimables par l’API.
- Les détails ne contiennent ni mot de passe, ni contenu complet de message, seulement des identifiants, états et compteurs.

<!-- backlinks:start -->
---

[← Retour aux décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Architecture technique](../architecture.md)
- [Audit](../../../api/src/Audit/doc/README.md)
- [ADR 007](007-protection-des-donnees.md)
<!-- backlinks:end -->
