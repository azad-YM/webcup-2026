# Agent backend Audit

Lire d’abord [la documentation locale](doc/README.md) et l’[ADR 006](../../../doc/technique/decisions/006-journal-des-actions.md).

Audit possède le journal des actions de l’administration (table `audit_entries`, ajout seul). Il ne connaît aucune règle des autres BC.

Règles :

- Les BC écrivent uniquement par le port Shared `AuditTrail`, appelé dans leur handler après contrôles et sauvegarde. Audit l’implémente dans `Infrastructure/Adapter/Shared/AuditTrailRecorder`. Ne jamais lire ni écrire les tables d’un autre BC.
- L’écriture passe par DBAL (`DbalAuditEntryRepository`) pour rejoindre la transaction du `command.bus` sans `flush` propre.
- Acteur : port `AuditActorProvider` (IAM). Lecture : port `AuditAccessPolicy` (Administration, `admin.audit.read` ; `admin.security.read` pour `iam.login.*`).
- Pas de secret dans `details` (mot de passe, jeton, contenu intégral) ; identifiants, états et compteurs seulement.
- Nouveau code d’action : `<bc>.<ressource>.<verbe>`, à ajouter au tableau de la documentation et aux libellés de l’admin (`modules/audit/core/domain/audit-entry.ts`).

Tests : aucun pour l’instant (voir les questions ouvertes de la documentation).
