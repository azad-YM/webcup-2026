# Documentation — Pilotage

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Pilotage
<!-- navigation:end -->

Pilotage est le BC du **suivi de l’activité de la ville par ses agents**. Il répond à « qu’attend la ville en ce moment ? » en relayant, de façon lisible, le flux de l’[API du concours Webcup](../../../../doc/contexte/README.md#lapi-du-concours-webcup) : état de la session (vague courante, prochaine vague) et demandes déjà diffusées. Il répond à la demande **D19** : un espace des agents distinct de l’espace citoyen, qui affiche les informations transmises par l’API Nova Terra.

Pilotage répond aussi à **F50** (tableau de bord simplifié de l’activité) et porte le **suivi interne des demandes Webcup** par l’équipe. Il ne stocke que ce suivi et ne connaît ni comptes ni rôles : il lit l’API du concours côté serveur (la clé ne quitte jamais le serveur) et demande à [Administration](../../Administration/doc/README.md) si la personne connectée peut consulter le flux.

## Consommateurs

- L’application [admin](../../../../front/apps/admin/doc/README.md), module `pilotage`, page « Flux Nova Terra » ([parcours](../../../../front/apps/admin/doc/pilotage.md)).
- Utilisateurs finaux : agents municipaux (rôle de référence « Agent municipal ») et administrateurs, via la permission `admin.pilotage.read`.

## Livré

### `GET /api/pilotage/webcup-feed`

Authentification JWT de l’admin. Autorisation : membre actif d’Administration avec `admin.pilotage.read`, sinon `403` sans appel à l’API du concours.

Réponse `200` :

```json
{
  "session": {
    "status": "running", "isRunning": true, "currentWave": 3, "elapsedMinutes": 281,
    "visibleRequestsCount": 28, "nextWaveNumber": 4, "minutesUntilNextWave": 19,
    "hasNextWave": true, "requestsCount": 28, "totalXpAvailable": 12460
  },
  "requests": [
    {
      "requestCode": "D01", "requesterName": "…", "requesterType": "…", "messagePublic": "…",
      "difficulty": "Facile", "difficultyLevel": 1, "xpBase": 250, "xpTimeBonus": 0, "xpTotal": 250,
      "xpAvailable": 250, "isInitial": true, "waveNumber": 0, "arrivalTime": "00:00:00",
      "groupName": null, "isAiRequest": false, "sortOrder": 1
    }
  ],
  "fetchedAt": "2026-10-03T14:41:00+00:00"
}
```

Règles de normalisation :

- Les champs documentés de l’API (`request_code`, `requester_name`, `requester_type`, `message_public`, `difficulty`, `difficulty_level`, `xp_base`, `xp_time_bonus`, `xp_total`, `xp_available`, `is_initial`, `wave_number`, `arrival_time`, `group_name`, `is_ai_request`, `sort_order` ; `session.*`) sont repris en camelCase. Les nombres envoyés en texte sont convertis ; un champ absent vaut `null` (ou `false`, `0` pour les booléens et XP). Une demande sans `request_code` est ignorée.
- Tri par `sort_order` croissant ; les demandes sans `sort_order` viennent ensuite, par `arrival_time` puis code.
- `requestsCount` = nombre de demandes renvoyées ; `totalXpAvailable` = somme des `xpAvailable` (ou `xpTotal` si l’API ne fournit pas `xp_available`) ; `hasNextWave` = une prochaine vague est annoncée avec un délai strictement positif.
- `fetchedAt` = instant de la lecture de l’API par le serveur. La réponse valide est gardée **20 s** (pool `pilotage.webcup_feed.cache`) : plusieurs agents qui actualisent ne déclenchent qu’un appel par fenêtre.

Erreurs (format commun `{path, message, code, details}`) :

| Cas | Statut | `code` |
|---|---|---|
| `WEBCUP_API_KEY` vide ou absente | 503 | `webcup_api_key_missing` |
| L’API du concours répond 401/403 | 502 | `webcup_api_key_rejected` (« Clé refusée par l’API du concours. ») |
| Panne, délai dépassé (5 s d’inactivité, 8 s au total), statut d’erreur, JSON illisible ou format inattendu | 502 | `webcup_feed_unavailable` |
| Pas membre actif avec `admin.pilotage.read` | 403 | — |
| Anonyme | 401 | — |

La clé n’est envoyée que dans l’en-tête `X-Webcup-Api-Key` ; elle n’apparaît dans aucune URL, réponse, message ou journal (les erreurs réseau ne journalisent que la classe d’exception).

### Variables d’environnement

Déclarées dans `api/.env.example` ; valeurs par défaut dans `config/services.yaml` pour que le conteneur démarre sans elles :

| Variable | Défaut | Rôle |
|---|---|---|
| `WEBCUP_API_URL` | `https://24h.webcup.fr/wp-json/webcup/v1/requests` | Endpoint lu en `GET` |
| `WEBCUP_API_KEY` | vide (→ 503) | Clé du concours, à définir uniquement dans `api/.env.local` |

### Suivi des demandes Webcup (outil de l’équipe, non testé)

Un suivi par `requestCode` (table `pilotage_request_tracking`) : `status` (`todo`, `in_progress`, `done`), `links` (au plus 10, `{label ≤ 80, url http(s) ≤ 500}`), `note` (≤ 500), `updatedAt`, `updatedBy` (nom du compte, sinon e-mail).

- Lecture : fusionné dans `GET /api/pilotage/webcup-feed` → `requests[].tracking` (`null` si jamais suivi, à lire comme `todo`) et `canEditTracking` (le compte détient `admin.pilotage.write`).
- `PUT /api/pilotage/tracking/{requestCode}` avec `{status, links, note}` : crée ou remplace le suivi ; `admin.pilotage.write` requis (403 sinon ; rôle « Administrateur principal », pas l’agent municipal) ; payload invalide → 422. Réponse : le suivi. Chaque mise à jour est journalisée (`pilotage.tracking.updated`, [Audit](../../Audit/doc/README.md)).
- Pré-remplissage : la migration `Version20261003009000` insère le statut de chaque code depuis le [registre du chantier](../../../../doc/chantier/demandes.md) (🟡/⚠️ → `in_progress`, ✅ → `done`, ⬜ → `todo`). La base de développement créée par `doctrine:schema:update` n’a pas ce pré-remplissage.
- Synchronisation du 2026-10-03 : `Version20261003110400` couvre les 71 codes du registre, avec statut et note explicative. Elle complète les suivis absents et actualise uniquement les lignes du préremplissage initial restées intactes ; tout suivi manuel (statut, note, liens, auteur) est conservé. Les fonctionnalités non vérifiées restent `in_progress`. Le snapshot est figé dans la migration, sans lecture du Markdown à l’exécution.

### Tableau de bord de l’activité (F50)

`GET /api/pilotage/activity` (`admin.pilotage.read`, agents compris) : `{generatedAt, recentHours: 24, requests: {byStatus, waiting, open, recent, oldestWaitingSince}, citizens: {active, suspended, recent}, communication: {activeAlerts, criticalAlerts, scheduledAlerts, publishedPublications, draftPublications}, security: {suspendedAccounts, blockedLogins}, administration: {activeMembers, services, disruptedServices}}`. Comptages seulement, aucune donnée personnelle. Chaque bloc vient de son propriétaire par un port de Pilotage ; « récent » = 24 dernières heures. Pas de temps réel : l’admin relit toutes les 60 s.

## Ports et raccordements

| Sens | Port (propriétaire) | Adaptateur (fournisseur) |
|---|---|---|
| Pilotage consomme l’API du concours | `Application/Ports/Gateway/WebcupFeedGateway` | `Infrastructure/Http/WebcupHttpFeedGateway` |
| Pilotage consomme Administration | `Application/Ports/Provider/PilotageAccessPolicy` | `Administration/Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` (`admin.pilotage.read`, `admin.pilotage.write`) |
| Pilotage consomme IAM (auteur du suivi) | `Application/Ports/Provider/CurrentAgentProvider` | `IAM/Infrastructure/Adapter/Pilotage/IAMPilotageCurrentAgent` |
| Tableau de bord ← Citizen | `Application/Ports/Provider/Activity/CitizenActivityProvider` | `Citizen/Infrastructure/Adapter/Pilotage/CitizenPilotageActivity` |
| Tableau de bord ← Communication | `Application/Ports/Provider/Activity/CommunicationActivityProvider` | `Communication/Infrastructure/Adapter/Pilotage/CommunicationPilotageActivity` |
| Tableau de bord ← IAM | `Application/Ports/Provider/Activity/AccountSecurityActivityProvider` | `IAM/Infrastructure/Adapter/Pilotage/IAMPilotageSecurityActivity` |
| Tableau de bord ← Administration | `Application/Ports/Provider/Activity/AdministrationActivityProvider` | `Administration/Infrastructure/Adapter/Pilotage/AdminPilotageActivity` |

Chaque adaptateur compte uniquement sur les tables de son propre BC.

Les erreurs contractuelles `WebcupApiKeyMissing`, `WebcupApiKeyRejected` et `WebcupFeedUnavailable` appartiennent à Pilotage.

## Tests

- Unitaires : `GetWebcupFeedTest` (handler avec stubs du port et de la politique : tri, synthèse, refus sans appel) et `WebcupHttpFeedGatewayTest` (adaptateur avec `MockHttpClient` : en-tête, normalisation, cache de 20 s, traduction des erreurs non mises en cache, clé absente des messages et des logs).
- Applicatif : `GetWebcupFeedTest` passe par la vraie route, le firewall, le bus de requêtes, l’adaptateur Administration réel et l’adaptateur HTTP réel ; l’API du concours est simulée par `Tests/Doubles/Http/WebcupApiSimulator` (succès, 403 amont, panne, clé absente, refus d’accès). Aucun appel réseau réel.

## Questions ouvertes

- Type exact de `xp_available` : non documenté. Un nombre est repris tel quel ; un booléen est interprété comme « tout `xp_total` » ou `0`. À vérifier sur une vraie réponse.
- Valeurs possibles de `session.status` et de `difficulty` : affichées telles quelles.
- Suivi et tableau de bord : aucun test écrit (décision d’économie du chantier).
- Pas d’historique : Pilotage n’enregistre pas les vagues passées ; la mise en évidence des nouvelles demandes est faite par le navigateur de l’agent.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [API](../../../README.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Administration](../../Administration/doc/README.md)
- [Administration — membres et habilitations](../../Administration/doc/membres-et-habilitations.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
- [Admin — flux Nova Terra](../../../../front/apps/admin/doc/pilotage.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Audit](../../Audit/doc/README.md)
<!-- backlinks:end -->
