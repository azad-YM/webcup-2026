# Documentation — Audit

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Audit
<!-- navigation:end -->

Audit est le BC du **journal des actions de l’administration** (lot L12, demandes F47 et F48). Il répond à « qui a fait quoi, quand et sur quoi ? » pour les agents et les administrateurs. Il ne décide d’aucune règle métier : chaque BC propriétaire déclare ses actions par le port Shared `AuditTrail` ([ADR 006](../../../../doc/technique/decisions/006-journal-des-actions.md)).

## Consommateurs

- Écrivains : les cas d’usage d’[Administration](../../Administration/doc/README.md), [Communication](../../Communication/doc/README.md), [Citizen](../../Citizen/doc/README.md), [IAM](../../IAM/doc/README.md) et [Pilotage](../../Pilotage/doc/README.md), via `Shared\Application\Ports\Service\AuditTrail`.
- Lecteurs : l’application [admin](../../../../front/apps/admin/doc/journal-des-actions.md), écran « Journal des actions » (`/admin/journal`).

## Livré (non testé)

### Actions enregistrées

| Code | Propriétaire (handler) | Cible |
|---|---|---|
| `administration.role.created` | `CreateRoleHandler` | rôle |
| `administration.member.added` | `AddMemberHandler` | membre |
| `administration.service.created` / `.updated` | `SaveMunicipalServiceHandler` | service municipal |
| `communication.alert.created` / `.updated` / `.published` / `.withdrawn` | `SaveAlertHandler` | alerte |
| `communication.publication.created` / `.updated` / `.published` / `.withdrawn` | `SavePublicationHandler` | publication |
| `citizen.request.status_changed` | `ChangeRequestStatusHandler` | demande citoyenne |
| `citizen.account.suspended` / `.reactivated` | `SetCitizenSuspensionHandler` | compte citoyen |
| `citizen.account.deleted` | `DeleteMyCitizenAccountHandler` (par le titulaire) | compte citoyen |
| `iam.login.blocked` | `DoctrineLoginAttemptLimiter` (acteur « Anonyme (…) ») | e-mail ou IP |
| `pilotage.tracking.updated` | `UpdateRequestTrackingHandler` | demande Webcup |
| `audit.anomaly.protected` | `ScanUnusualActivityHandler` (acteur « Détection automatique ») | compte |
| `audit.anomaly.status_changed` | `ChangeAnomalyStatusHandler` | anomalie |

L’entrée est écrite dans la transaction du `command.bus` (DBAL, sans `flush`) : une action refusée ne laisse aucune trace. Le verrouillage de connexion, hors bus, écrit immédiatement.

### `GET /api/audit/entries`

Paramètres facultatifs : `actor` (identifiant de compte), `action` (code exact), `category` (`administration`, `communication`, `citizen`, `iam`, `pilotage`), `from` et `to` (jours inclus, `AAAA-MM-JJ`), `q` (recherche dans le résumé, l’acteur et la cible). Les 200 lignes les plus récentes.

Réponse : `{ items: [{ id, occurredAt, actor: {id, label}, action, category, target: {type, id}, summary, details }], limit, facets: { actions, actors } }`.

Autorisation : `admin.audit.read` (sinon 403) ; les lignes `iam.login.*` exigent en plus `admin.security.read`. Date invalide : 422.

## Ports et raccordements

| Sens | Port (propriétaire) | Adaptateur (fournisseur) |
|---|---|---|
| Les BC écrivent dans le journal | `Shared/Application/Ports/Service/AuditTrail` | `Audit/Infrastructure/Adapter/Shared/AuditTrailRecorder` |
| Audit consomme IAM | `Application/Ports/Provider/AuditActorProvider` | `IAM/Infrastructure/Adapter/Audit/IAMAuditActorProvider` |
| Audit consomme Administration | `Application/Ports/Provider/AuditAccessPolicy` | `Administration/Infrastructure/Adapter/Audit/AdminAuditAccessPolicy` |

Persistance : table `audit_entries` (mapping `Infrastructure/Doctrine/Entity/AuditEntry.orm.xml`, migration `Version20261003009000`).

## Questions ouvertes

- Rétention et purge (RGPD) ; export CSV.
- Actions non encore journalisées faute de cas d’usage : modification ou suppression de rôle, changement des rôles d’un membre, désactivation d’un membre.
- Aucun test écrit (décision d’économie du chantier) : tests unitaires du handler et applicatifs de la route à ajouter.

## Activité inhabituelle et informations incohérentes (F85, lot L25 — non testé)

Mission : repérer ce qui sort de l’usage habituel ou ce qui est incohérent dans les données, l’expliquer en français et réagir quand un compte est attaqué ([ADR 012](../../../../doc/technique/decisions/012-montee-en-charge-integrite-anti-abus.md)). Lecteurs : agents `admin.security.read`, écran [« Activité inhabituelle »](../../../../front/apps/admin/doc/securite.md#activité-inhabituelle-f85-non-testé).

- Table `audit_anomalies` (migration `Version20261004120100`) : empreinte unique (même phénomène = même ligne, `occurrences`), gravité `info` / `warning` / `critical`, explication, éléments liés masqués, statut `new` / `seen` / `handled`, réaction appliquée.
- Analyse : `ScanUnusualActivity` (command.bus) lancé par `app:security:scan` (cron 5 min) ou `POST /api/audit/anomalies/scan` ; règles et seuils dans `Application/Service/UnusualActivityDetector`.
- Sources par ports : `AccountSignalsProvider` et `AccountProtector` (IAM, `Infrastructure/Adapter/Audit/IAMAccountSignals`, `IAMAccountProtector`), `CitizenSignalsProvider` (Citizen, `Infrastructure/Adapter/Audit/CitizenSignals`), `AbuseSignals` (Shared), journal `audit_entries`.
- Réaction : compte attaqué → verrouillage 15 min, code e-mail exigé 24 h, titulaire prévenu ; action `audit.anomaly.protected` (acteur « Détection automatique »). Nouvelle anomalie grave → temps réel `administration.security` / `security.anomaly_detected`.
- Routes (`admin.security.read`) : `GET /api/audit/anomalies?status=&severity=` (anomalies, compteurs, refus de robots et rafales 24 h, dernière analyse), `PUT /api/audit/anomalies/status` `{id, status}` (journalisé `audit.anomaly.status_changed`), `GET /api/audit/anomalies/summary` (résumé IA par `LanguageModel`, repli par règles, `source: ai|rules`, mis en cache 10 min ; suspendu en mode allégé).

Nouveaux codes d’action : `audit.anomaly.protected`, `audit.anomaly.status_changed`.

Questions ouvertes : seuils à ajuster sur données réelles ; purge des anomalies traitées ; pas de test écrit.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [ADR 006](../../../../doc/technique/decisions/006-journal-des-actions.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [Admin — journal des actions](../../../../front/apps/admin/doc/journal-des-actions.md)
- [ADR 012](../../../../doc/technique/decisions/012-montee-en-charge-integrite-anti-abus.md)
<!-- backlinks:end -->
