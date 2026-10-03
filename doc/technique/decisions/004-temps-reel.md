# ADR 004 — Temps réel derrière un port : SSE maison sur la base de données, fournisseur interchangeable

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 004
<!-- navigation:end -->

- Statut : accepté
- Date : 2026-10-03

## Contexte

Plusieurs demandes veulent qu’une information apparaisse sans recharger la page : alertes et annonces importantes (D18, F29, F30), changement de statut d’une demande pour le citoyen, nouvelle demande dans la file des agents (L2).

Contraintes :

- l’API tourne sous nginx + php-fpm ; les événements de domaine sont consommés par un worker Messenger, dans un autre processus que les requêtes HTTP ;
- la production sera un hébergement **cPanel sans Docker** (SSH, tâches cron, « Setup Node.js App ») : pas de processus permanent ni de port dédié.

## Options étudiées

1. **SSE fait maison** (`EventStreamResponse` de Symfony) : il faut un relais entre le worker et les connexions (table interrogée en boucle ou Redis), chaque onglet ouvert occupe un processus PHP (quelques connexions suffisent à saturer php-fpm ou la limite de processus d’un cPanel), `EventSource` ne peut pas envoyer l’en-tête `Authorization` des JWT.
2. **Mercure** : règle ces trois points, mais le hub est un processus permanent, impossible à lancer sur cPanel ; l’offre hébergée est payante.
3. **Service hébergé (Pusher Channels)** (choix de la première version) : PHP publie par un appel HTTPS signé ; le navigateur se connecte au service. Rien à faire tourner chez nous, même chaîne en développement et en production ; offre gratuite suffisante pour le concours.
4. **Polling** : aucune dépendance, mais pas instantané.

## Décision

**SSE maison** : `EventStreamResponse` de Symfony + un buffer d’événements en base de données, derrière un port technique indépendant du fournisseur. Le fournisseur reste un **réglage d’infrastructure** (`REALTIME_TRANSPORT`) : on pourra revenir à Mercure, Pusher, Redis ou WebSocket sans toucher aux cas d’usage, au câblage des BC ni au code des écrans.

Historique : la première version retenait Pusher, la deuxième Mercure. Les deux sont abandonnés pour le concours : l’infrastructure fournie n’autorise que ses technologies (PHP, MySQL), sans hub Mercure ni service tiers. Leurs adaptateurs restent dans le code, non configurés.

### Backend

```text
Cas d'usage ─► événement de domaine ─► handler applicatif du BC ─► port RealtimePublisher
                                                                        │ REALTIME_TRANSPORT
                                         database (défaut) ─────────────┤
                                           └─► table realtime_event     ├─ mercure, pusher (optionnels)
                                                 │                      └─ none
                              GET /api/realtime/stream (SSE) ◄─┘
```

- Port `Shared\Application\Ports\Service\RealtimePublisher::publish(topic, event, payload)` ; il ne nomme aucune technologie.
- `RealtimePublisherFactory` fournit le port selon `REALTIME_TRANSPORT` : `database` (défaut), `mercure`, `pusher`, `none`. Ajouter un fournisseur = un adaptateur + une entrée du locator dans `config/services.yaml`.
- **`DatabaseRealtimePublisher`** insère dans `realtime_event` (`id` auto-incrémenté, `topic`, `type`, `payload` JSON, `created_at`, index `(topic, id)`). La table appartient à `Shared/Infrastructure/Realtime`, à aucun BC. Dans une transaction, l’événement n’apparaît qu’au commit ; un échec d’écriture est journalisé, jamais remonté.
- **Une seule route de flux** `GET /api/realtime/stream` (`Shared/Infrastructure/Realtime/Http/RealtimeController`), pour une seule connexion par onglet :
  - topics publics `public.*` pour tout le monde ;
  - topics privés seulement avec un **ticket** : `EventSource` ne sait pas envoyer l’en-tête `Authorization` et un JWT ne va jamais dans une URL. Le client échange son JWT contre un ticket opaque signé (`POST /api/realtime/tickets`, 15 min), qui ne sert qu’à ouvrir le flux ;
  - les topics privés sont **décidés par le serveur** : chaque BC implémente le port `Shared\Application\Ports\Provider\RealtimeAudienceProvider` (tag automatique) pour ses propres topics. Livré : Citizen → `citizen.{citizenId}` ; Administration → `administration.requests` pour les membres ayant `admin.request.read` (L2, `AdminRequestsRealtimeAudience`). Citizen → `district.{quartier}` et `alerts.health` pour les alertes ciblées de [Communication](../../../api/src/Communication/doc/README.md) (L7). Un topic envoyé par le client est ignoré ;
  - le compte connecté est fourni par IAM via le port `RealtimeAccountProvider`.
- **Connexions courtes** : chaque flux ouvert occupe un processus PHP. Le serveur ferme la connexion après `REALTIME_STREAM_SECONDS` (20 s) ; `EventSource` se reconnecte seul (`retry: 1000`) et envoie `Last-Event-ID`. Le flux lit la table chaque seconde, envoie `: keep-alive` toutes les 5 s, les en-têtes `X-Accel-Buffering: no` et `Cache-Control: no-transform` contre la mise en tampon des proxys. Ne pas activer de compression sur cette route.
- **Reprise** : l’identifiant SSE est l’`id` de `realtime_event`. Le serveur sert `id > Last-Event-ID` (en-tête, ou paramètre `lastEventId` à la réouverture). Une nouvelle connexion sans identifiant commence après le dernier événement existant : pas de rejeu de l’historique.
- **Purge** : `app:realtime:purge --older-than=3600`, par cron. Diagnostic : `app:realtime:publish [topic] [event] [payload]`.

### Frontend

- Client commun `@boilerplate/shared-utils/realtime` : `openRealtimeStream({ apiBaseUrl, eventTypes, onEvent, getTicket })` et `createRealtimeTicketProvider(apiBaseUrl, getToken)`. Il gère la reprise après refus (ticket expiré : nouveau ticket, réouverture depuis le dernier identifiant reçu).
- Chaque application définit son port d’abonnement dans `core/application` et l’implémente avec ce client dans son infrastructure ; un seul flux par application et par onglet, partagé par les écrans.
- À réception, l’écran invalide le cache RTK Query concerné. **Filet de sécurité obligatoire** : chaque écran temps réel garde un `pollingInterval` (60 s par exemple).

### Règles

- La donnée de référence reste l’API : le message dit seulement ce qui a changé (identifiants, statut), jamais de données personnelles.
- Le domaine ne connaît pas le temps réel : un événement de domaine (`ServiceRequestStatusChanged`) et un événement temps réel (`request.status_changed`) sont distincts ; un handler applicatif du BC propriétaire fait la projection.
- Les BC ne communiquent jamais entre eux par le temps réel : ports et événements de domaine (`event.bus`).
- Topics : segments séparés par des points (`public.alerts`, `citizen.{id}`, `administration.requests`).
- Tous les événements temps réel ne passent pas par Communication ([ADR 005](005-bc-communication.md)) : chaque BC publie ses propres changements.

## Conséquences

- Aucune brique serveur supplémentaire : le temps réel tourne sur PHP + MySQL, en développement comme sur l’hébergement du concours.
- **Charge** : un flux ouvert = un processus PHP pendant au plus 20 s, et une requête SQL indexée par seconde. Avec peu de processus PHP disponibles (hébergement mutualisé), garder un seul flux par onglet et une durée courte ; baisser `REALTIME_STREAM_SECONDS` si l’API ralentit.
- **Délai** : les handlers qui publient consomment des événements routés vers `async` ; le délai dépend du worker (redémarré toutes les 5 min en développement, relancé chaque minute par cron en production avec `--time-limit=55`).
- Un ticket est lisible dans les journaux d’accès (paramètre d’URL) : il expire en 15 min et ne donne accès qu’au flux, jamais à l’API.
- Revenir à Mercure ou Pusher plus tard : changer `REALTIME_TRANSPORT`, configurer l’adaptateur et brancher l’adaptateur front correspondant, sans toucher aux cas d’usage.

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [Architecture technique](../architecture.md)
- [ADR 005](005-bc-communication.md)
- [Documentation — Shared](../../../api/src/Shared/doc/README.md)
- [Contexte produit](../../contexte/README.md)
- [Chantier](../../chantier/README.md)
- [Site](../../../front/apps/site/doc/README.md)
- [Citizen](../../../api/src/Citizen/doc/README.md)
- [Administration](../../../api/src/Administration/doc/README.md)
- [Admin](../../../front/apps/admin/doc/README.md)
- [Site — parcours citoyen](../../../front/apps/site/doc/parcours-citoyen.md)
- [Communication](../../../api/src/Communication/doc/README.md)
<!-- backlinks:end -->
