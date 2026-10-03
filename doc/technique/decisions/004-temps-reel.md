# ADR 004 — Temps réel derrière un port, Mercure par défaut, fournisseur interchangeable

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

Mercure (SSE) par défaut, derrière un port technique indépendant du fournisseur. **Le fournisseur est un réglage d’infrastructure** : on passe de Mercure à Pusher (ou à rien) en changeant une variable d’environnement, sans toucher aux cas d’usage, au câblage des BC ni au code des écrans.

Révision du 2026-10-03 : la première version retenait Pusher (option 3). Mercure est préféré pour garder la maîtrise du transport (standard ouvert, SSE, pas de compte tiers en développement). L’adaptateur Pusher est conservé comme alternative.

Backend :

- Port `Shared\Application\Ports\Service\RealtimePublisher::publish(topic, event, payload)`. Il ne nomme aucune technologie.
- Adaptateurs dans `Shared\Infrastructure\Realtime` :
  - `MercureRealtimePublisher` : `POST` sur le hub (formulaire `topic`, `type` = nom d’événement, `data` = JSON), JWT éditeur HS256 signé avec `MERCURE_JWT_SECRET`, sans bundle ;
  - `PusherRealtimePublisher` : API HTTP Pusher signée HMAC-SHA256 ;
  - `NullRealtimePublisher` : temps réel coupé.
- `RealtimePublisherFactory` fournit le port selon `REALTIME_TRANSPORT` (`mercure` | `pusher` | `none`). Ajouter un fournisseur = un adaptateur + une entrée du locator dans `config/services.yaml`.
- Variables : `REALTIME_TRANSPORT`, `MERCURE_URL` (hub vu par l’API), `MERCURE_JWT_SECRET`, `PUSHER_*`. Secrets dans `api/.env.local`, jamais versionnés. Sans secret ou identifiants, la publication est désactivée sans erreur.
- Développement : service `mercure` dans `docker/compose.dev.yaml` (hub sur `http://localhost:3333/.well-known/mercure`, abonnements anonymes autorisés, CORS pour le site et l’admin).

Frontend (à construire avec le premier cas d’usage, L2 ou L7) :

- chaque application définit son port d’abonnement dans `core/application` (ex. `RealtimeSubscriber.subscribe(topic, onEvent)`) ;
- adaptateurs dans `infrastructure/for-production` : `EventSource` pour Mercure, `pusher-js` pour Pusher, aucun pour `none` ; le kernel choisit selon `NEXT_PUBLIC_REALTIME_TRANSPORT` / `VITE_REALTIME_TRANSPORT` et l’URL `*_REALTIME_URL` ;
- à réception, l’écran invalide le cache RTK Query concerné ;
- **filet de sécurité obligatoire** : chaque écran temps réel garde un rafraîchissement périodique (`pollingInterval`, 60 s par exemple), pour fonctionner même si le transport est coupé ou mal configuré.

Règles inchangées :

- diffusion au mieux : un hub indisponible ou un refus est journalisé, jamais remonté ; un cas d’usage n’échoue jamais à cause du temps réel ;
- la donnée de référence reste l’API : le message dit seulement ce qui a changé (identifiants, statut), jamais de données personnelles ;
- topics logiques en segments séparés par des points (`public.alerts`), utilisés tels quels comme topics Mercure ou canaux Pusher ;
- les BC ne communiquent jamais par le temps réel : entre eux, ports et événements de domaine (`event.bus`) ; un handler applicatif du BC propriétaire écoute son événement et appelle le port ;
- tous les événements temps réel ne passent pas par Communication ([ADR 005](005-bc-communication.md)) : un BC publie ses propres changements.

## Conséquences

- **Production sur cPanel** : le hub Mercure est un processus permanent qu’un cPanel ne peut pas lancer. En production, il faut soit un hub hébergé (Mercure Cloud, ou un petit serveur dédié au hub), soit `REALTIME_TRANSPORT=pusher`, soit `none` (rafraîchissement périodique seul). C’est précisément ce que permet le choix par configuration.
- **Topics privés** (statut des demandes d’un citoyen, file des agents, notifications personnelles) : nécessaires dès le lot L2. À ajouter : publication `private` côté Mercure (canal `private-…` côté Pusher) et une route d’API qui vérifie les droits puis délivre l’accès (JWT abonné Mercure en cookie ou paramètre `authorization`, signature de canal Pusher). Non livré.
- Délai : les handlers temps réel consomment des événements routés vers `async`. En développement le worker redémarre toutes les 5 minutes ; sur cPanel il est relancé chaque minute par cron (`messenger:consume async --time-limit=55`).
- Dette assumée : avec Pusher, dépendance à un service tiers (compte, quotas, données hors de notre hébergement) ; avec Mercure en production, un hub à héberger.

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
<!-- backlinks:end -->
