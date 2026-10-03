# Architecture technique

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Architecture](README.md) › Architecture technique
<!-- navigation:end -->

## Vue d’ensemble

```text
Site Next.js (portail citoyen) ──┐
Admin React/Vite (agents) ───────┼──► API Symfony ──► MySQL 8.4
                                 │         │
                                 │         └──► Worker Messenger (transport Doctrine)
                                 └── code à usage unique + PKCE entre site et admin
```

## API modulaire

L’API est découpée en bounded contexts (BC) de même niveau : `IAM`, `Administration`, `Citizen` et `Pilotage`, plus le socle `Shared`. Un BC peut être subdivisé en sous-domaines (SD) lorsqu’il grossit. Chaque BC simple ou SD porte `Application`, `Domain`, `Infrastructure`, `Tests` et `doc`.

```text
api/src/
├── IAM/                        BC identité : comptes, login JWT, codes de portail, espaces
├── Administration/             BC organisation municipale : membres, rôles, permissions
│                               (cible : services municipaux)
├── Citizen/                    BC relation habitants–ville : citoyens (inscription, profil), demandes et file des agents
├── Pilotage/                   BC pilotage : flux de l’API du concours Webcup (sans persistance)
├── Communication/              BC à construire : publications, alertes, audiences (ADR 005)
└── Shared/                     kernel, AppController, exceptions, AggregateRoot, ports techniques (dont temps réel)
```

- `Domain` contient les entités, règles et événements, sans dépendance au framework (dette connue : `User` implémente les interfaces Symfony) ;
- `Application` contient commandes, queries, handlers, contrôleurs, DTO et ports ;
- `Infrastructure` contient les adaptateurs Doctrine, sécurité et intermodules ;
- `Tests` contient doubles, fixtures et suites `Unit` / `Application`.

### Bus et transactions

- `command.bus` : middleware `doctrine_transaction` (flush, commit, rollback) ;
- `query.bus` : lecture, sans transaction ;
- `event.bus` : événements de domaine, routés vers le transport `async`.

### Temps réel

Un BC qui veut faire apparaître un changement sans rechargement écoute son événement de domaine dans un handler applicatif et appelle le port technique `Shared\Application\Ports\Service\RealtimePublisher`. Le fournisseur est un réglage d’infrastructure : `RealtimePublisherFactory` fournit le port selon `REALTIME_TRANSPORT` (`database` par défaut : buffer `realtime_event` lu par le flux SSE `GET /api/realtime/stream` ; `mercure`, `pusher`, `none`). Chaque BC déclare les topics privés de ses utilisateurs via `RealtimeAudienceProvider` ; chaque adaptateur de `Shared\Infrastructure\Realtime` est le seul code qui connaît son fournisseur. Les BC ne communiquent jamais entre eux par ce canal ; la donnée de référence reste l’API. Voir l’[ADR 004](decisions/004-temps-reel.md).

Le contrôleur reçoit la commande via `#[MapRequestPayload]` puis appelle `AppController::dispatch()`. Les exceptions sont traduites par `Shared\Application\Listener\ExceptionListener` (403, 404, 409, 422, 500).

## Frontières entre modules

Aucun module consommateur n’appelle les détails internes d’un autre (même entre SD d’un même BC). Le consommateur définit un port dans sa couche Application ; le fournisseur l’implémente dans sa propre Infrastructure ; la composition injecte l’adaptateur. Voir l’[ADR 002](decisions/002-frontieres-et-acces.md).

Raccordements livrés, à reproduire :

| Consommateur (port) | Fournisseur (adaptateur) |
|---|---|
| `Administration` — `CurrentAccountProvider` | `IAM/Infrastructure/Adapter/Administration/IAMCurrentAccountProvider` |
| `Administration` — `MemberAccountProvisioner` | `IAM/Infrastructure/Adapter/Administration/IAMMemberAccountProvisioner` |
| `Citizen` — `CitizenAccountProvisioner` | `IAM/Infrastructure/Adapter/Citizen/IAMCitizenAccountProvisioner` |
| `Citizen` — `CurrentAccountProvider` | `IAM/Infrastructure/Adapter/Citizen/IAMCurrentAccountProvider` |
| `Citizen` — `CitizenAccountManager` (L8) | `IAM/Infrastructure/Adapter/Citizen/IAMCitizenAccountManager` |
| `Citizen` — `CitizenAccountAccessPolicy` (L8) | `Administration/Infrastructure/Adapter/Citizen/AdminCitizenAccountAccessPolicy` |
| `IAM` — `SecurityJournalAccessPolicy` (L8) | `Administration/Infrastructure/Adapter/IAM/AdminSecurityJournalAccessPolicy` |
| `IAM` — `AccessibleSpacesProvider` | `Administration/Infrastructure/Adapter/IAM/AdminAccessibleSpacesProvider` |
| `Pilotage` — `PilotageAccessPolicy` | `Administration/Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` |
| `Citizen` — `RequestAccessPolicy` | `Administration/Infrastructure/Adapter/Citizen/AdminRequestAccessPolicy` |
| `Shared` (flux temps réel) — `RealtimeAccountProvider` | `IAM/Infrastructure/Adapter/Shared/IAMRealtimeAccountProvider` |
| `Shared` (flux temps réel) — `RealtimeAudienceProvider` (tag `shared.realtime_audience`) | `Citizen/Infrastructure/Adapter/Shared/CitizenRealtimeAudience` (`citizen.{citizenId}`), `Administration/Infrastructure/Adapter/Shared/AdminRequestsRealtimeAudience` (`administration.requests`) |

Temps réel : Citizen projette ses événements de domaine de demande (`PublishServiceRequestRealtime`) vers le port `RealtimePublisher` ; voir l’[ADR 004](decisions/004-temps-reel.md).

Pilotage lit aussi l’API externe du concours par son port `WebcupFeedGateway`, implémenté dans sa propre infrastructure (`Infrastructure/Http/WebcupHttpFeedGateway`, cache de 20 s) ; voir [Pilotage](../../api/src/Pilotage/doc/README.md).

Publications et alertes : BC `Communication` à construire, qui consultera Administration (droit de publier) et Citizen (audience) par ses ports ; voir l’[ADR 005](decisions/005-bc-communication.md).

Point d’extension : un BC exposant son propre espace implémente `IAM\Application\Ports\Provider\AccessibleSpacesProvider` dans son infrastructure (tag `iam.accessible_spaces`).

Répartition identité / profils métier : IAM ne connaît que des comptes ; un BC métier qui rattache un profil à un compte (membre, citoyen) porte le cas d’usage et demande la création du compte à IAM via son propre port, dans la même transaction. Voir l’[ADR 003](decisions/003-identite-et-habilitations.md).

La CLI d’[initialisation de l’administrateur](../../api/src/Administration/doc/initialisation-admin.md) est l’unique exception explicite : elle compose compte, rôle et membre directement, hors workflows applicatifs.

## Frontend

Monorepo pnpm : `apps/site` (portail citoyen), `apps/admin` (espace de travail des agents), `packages/shared-ui`, `packages/shared-utils`, `packages/shared-config`. Une application n’importe jamais le code interne d’une autre.

Chaque module d’application suit :

```text
modules/<module>/
├── core/
│   ├── domain/                 types et règles pures
│   ├── application/            dto, ports (gateway, provider), usecases, rtk-api
│   └── infrastructure/         for-production (http, local), for-tests
└── ui/                         layouts, pages, sections, modals
```

Chaîne : UI → RTK Query → use case (`withUseCase`) → port gateway → adaptateur injecté par le kernel (`modules/shared/core/config`). Entre modules frontend, même règle que le backend : chaque module métier de l’admin (aujourd’hui `admin`, `pilotage`, `requests`, `citizen-accounts` et `security`) définit son port de session, implémenté par le module `auth` (`auth/core/infrastructure/adapter/<module>`).

## Authentification

1. Le site appelle `POST /api/login_check` et reçoit un JWT d’audience `site`.
2. Il liste les espaces via `GET /api/iam/me/spaces`.
3. L’admin démarre `/auth/start` (état + vérificateur PKCE), le site appelle `POST /api/iam/portal-codes`, puis l’admin échange le code via `POST /api/iam/portal-sessions` et reçoit un JWT d’audience `admin`.

Chaque JWT porte la version de session du compte : suspendre, réactiver ou supprimer un compte invalide toutes ses sessions (site et admin). Le login est protégé par un verrouillage progressif par compte, par IP et par couple compte+IP (`429`, lot L8).

Détails : [IAM — comptes et sessions](../../api/src/IAM/doc/comptes-et-sessions.md) et [parcours de connexion du site](../../front/apps/site/doc/parcours-connexion.md).

## Tests

- Unitaires : handlers construits avec doubles (`Ram*`, `Stub*`), sans kernel ni Docker.
- Applicatifs : vraie route, Messenger, Doctrine, firewall JWT, sur MySQL 8.4 Testcontainers isolé par processus ; schéma recréé avant chaque test.
- Frontend : Vitest pour règles de domaine, use cases via le store RTK et contrats HTTP des gateways.

## Consignes des agents

Les `AGENTS.md` sont répartis par périmètre : racine, `api/`, chaque BC/SD, `front/`, chaque application et `front/packages/`.

<!-- backlinks:start -->
---

[← Retour à Architecture](README.md)

**Référencé depuis :**

- [Documentation](../README.md)
- [Documentation — IAM](../../api/src/IAM/doc/README.md)
- [Documentation — Administration](../../api/src/Administration/doc/README.md)
- [Documentation — Citizen](../../api/src/Citizen/doc/README.md)
- [Documentation — Shared](../../api/src/Shared/doc/README.md)
- [Documentation — Pilotage](../../api/src/Pilotage/doc/README.md)
- [Contexte produit](../contexte/README.md)
- [ADR 003](decisions/003-identite-et-habilitations.md)
<!-- backlinks:end -->
