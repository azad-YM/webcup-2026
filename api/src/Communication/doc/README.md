# Documentation — Communication

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Communication
<!-- navigation:end -->

Communication est le BC de **l’information que la ville adresse à ses habitants** : à qui, quand et avec quelle importance ([ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)). Il porte deux agrégats :

- **Publication** (D06, F30) : actualité, annonce, changement de service, information pratique ; une publication peut être marquée **importante** et apparaît alors dans les notifications des citoyens ;
- **Alerte** (D18, F29, F31) : information urgente avec une **gravité** (`info`, `warning`, `critical`), une **période de validité** et une **audience** (tous les habitants, un quartier, les citoyens qui ont consenti aux alertes sanitaires), avec des **recommandations** rédigées à la main par les agents (pas de génération par IA).

Communication ne connaît ni comptes, ni rôles, ni profils : il demande à [Administration](../../Administration/doc/README.md) si l’agent peut publier et quels quartiers existent, et à [Citizen](../../Citizen/doc/README.md) le quartier et le consentement du citoyen connecté. Le catalogue des **services municipaux** n’est pas ici : il appartient à Administration.

## Consommateurs

- Le [site](../../../../front/apps/site/doc/README.md) : actualités et lecture d’un article, bandeau d’alertes sur toutes les pages, notifications de l’espace citoyen ([parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)).
- L’[admin](../../../../front/apps/admin/doc/README.md), module `content` : création, publication et retrait par les agents ([contenus](../../../../front/apps/admin/doc/contenus.md)).
- Utilisateurs finaux : habitants (lecture), agents municipaux et administrateurs (permission `admin.communication.write`).

## Livré (lots L3 et L7, non vérifié dans un navigateur)

- Publications : création, révision, publication, retrait ; liste publique et lecture ; annonce importante.
- Alertes : création, révision, diffusion, retrait ; bandeau public (audience « tous ») ; notifications ciblées du citoyen.
- Temps réel : projection des événements de domaine vers le port `RealtimePublisher` ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)).
- Contenu initial : les trois premières actualités de la ville sont insérées par la migration `Version20261003003000`.
- Message officiel du Haut Conseil (F73, L26 — non testé, non vérifié dans un navigateur) : une alerte de catégorie `official` (colonnes `category`, `signatory`, migration `Version20261004130100`) ; toujours adressée à tous (`audience = all`), signataire obligatoire, recommandations = « ce qu’il faut savoir ou faire ». Publiée par `admin.communication.write` avec `confirmOfficial: true` (sinon `422`) ; journalisée `communication.official-message.{created,updated,published,withdrawn}`. Elle passe en tête de `GET /api/communication/alerts` et du bandeau du site, arrive par l’événement temps réel `alert.published` (topic `public.alerts`, après traitement par le worker `async`) avec un repli `polling` de 60 s côté site. `GET /api/communication/official-messages` (public, cache 15 s invalidé à l’écriture) : archive des messages officiels publiés, du plus récent au plus ancien (50 au plus), avec `active`.
- Aucun test automatisé n’a été écrit pour ce BC (décision d’économie du chantier) : pas de suite PHPUnit `Communication` pour l’instant.

## Règles

- Cycle de vie commun : `draft` → `published` → `withdrawn` (une publication ou une alerte retirée peut être republiée). Seul l’état `published` est visible du public ; un brouillon ou un élément retiré répond `404` en lecture publique.
- Publication : titre (200), catégorie libre (80), résumé (1 000), contenu en paragraphes (1 à 50, 5 000 caractères chacun). La date de première publication est conservée lors des republications.
- Alerte : titre (200), message (5 000), gravité, audience, début et fin de validité (ISO 8601, fin strictement après le début), recommandations (0 à 50 paragraphes). Une alerte est **active** si elle est publiée et que `startsAt ≤ maintenant < endsAt`.
- Audience `district` : le quartier est obligatoire et doit appartenir à la **liste fermée** d’Administration (Nord, Sud, Est, Ouest, Centre, Port). Pour les autres audiences, le quartier est ignoré.
- Audience `health` : seuls les citoyens qui ont donné leur **consentement explicite** (révocable, sans donnée médicale) la reçoivent.
- Une alerte concerne un citoyen si l’audience est `all`, si son quartier de profil est celui de l’alerte, ou si l’audience est `health` et qu’il a consenti.
- Tri des alertes : la plus grave d’abord, puis le début le plus récent. Tri des publications : la plus récente d’abord.
- L’identifiant est généré par le serveur à la création (UUID) ; il est transmis pour réviser.

## Contrat HTTP

Format d’erreur commun `{path, message}` : `400` règle métier refusée (message français affichable), `403` sans permission, `404` introuvable ou compte non citoyen, `422` payload invalide, `401` anonyme sur une route protégée.

### Lecture publique (sans compte)

| Route | Réponse |
|---|---|
| `GET /api/communication/publications` (`?important=1` pour les seules annonces importantes) | Liste des publications publiées |
| `GET /api/communication/publications/{id}` | Une publication publiée, sinon `404` |
| `GET /api/communication/alerts` | Alertes actives d’audience `all` (bandeau du site), messages officiels en tête |
| `GET /api/communication/official-messages` | F73 : archive des messages officiels publiés (`+ active`) |

Publication publique :

```json
{ "id": "…", "title": "…", "category": "Santé", "summary": "…", "body": ["…"], "important": true, "publishedAt": "2026-10-03T09:00:00+00:00" }
```

Alerte publique :

```json
{ "id": "…", "title": "…", "message": "…", "severity": "critical", "audience": "district", "district": "Sud",
  "startsAt": "2026-10-03T08:00:00+00:00", "endsAt": "2026-10-04T08:00:00+00:00", "recommendations": ["…"], "publishedAt": "…",
  "category": "standard", "signatory": null }
```

### Citoyen connecté

`GET /api/communication/me/notifications` (JWT) → `{ "alerts": [Alerte…], "announcements": [Publication…] }` : alertes actives qui le concernent (y compris celles adressées à tous) et les 10 dernières annonces importantes. `404` si le compte n’est pas citoyen.

### Agents (`admin.communication.write`)

| Route | Corps | Réponse |
|---|---|---|
| `GET /api/communication/manage/publications` | — | Toutes les publications (avec `state`, `updatedAt`), la plus récemment modifiée d’abord |
| `PUT /api/communication/manage/publications` | `{id?, title, category, summary, body[], important, state}` | La publication enregistrée |
| `GET /api/communication/manage/alerts` | — | Toutes les alertes (avec `state`, `updatedAt`) |
| `PUT /api/communication/manage/alerts` | `{id?, title, message, severity, audience, district?, startsAt, endsAt, recommendations[], state}` | L’alerte enregistrée |

Sans `id`, une nouvelle publication ou alerte est créée ; avec un `id` inconnu : `404`. Toutes les conditions sont vérifiées avant l’enregistrement : un refus n’enregistre rien et ne publie aucun événement.

## Événements et temps réel

| Événement de domaine | Quand | Événement temps réel | Topic | Payload |
|---|---|---|---|---|
| `PublicationPublished` | passage à `published` | `publication.important` si importante, sinon `publication.published` | `public.publications` | `{id, important}` |
| `AlertPublished` | chaque enregistrement à l’état `published` (diffusion ou mise à jour) | `alert.published` | selon l’audience | `{id, severity, district?}` |
| `AlertWithdrawn` | sortie de l’état `published`, ou changement d’audience d’une alerte publiée (ancienne audience) | `alert.withdrawn` | selon l’audience | `{id, severity, district?}` |

Topics des alertes : `public.alerts` (audience `all`, public), `district.{quartier en minuscules}` (ex. `district.sud`) et `alerts.health`. Les topics privés sont **accordés par le serveur** : `Citizen/Infrastructure/Adapter/Shared/CitizenAlertRealtimeAudience` (port `RealtimeAudienceProvider`) les calcule à partir du quartier et du consentement du citoyen connecté. Le client ne choisit jamais ses topics. Le payload ne contient aucune donnée personnelle : à réception, l’écran recharge depuis l’API.

Le handler `Application/EventHandler/ProjectCommunicationToRealtime` consomme les événements routés vers `async` : le délai dépend du worker Messenger. Le début ou la fin de validité d’une alerte ne produit pas d’événement : les écrans gardent un rafraîchissement de secours de 60 s.

## Raccordements

| Port de Communication | Adaptateur | Besoin |
|---|---|---|
| `Ports/Provider/CommunicationAccessPolicy` | `Administration/Infrastructure/Adapter/Communication/AdminCommunicationAccessPolicy` | permission `admin.communication.write` |
| `Ports/Provider/DistrictDirectory` | `Administration/Infrastructure/Adapter/Communication/AdminCommunicationDistrictDirectory` | liste fermée des quartiers |
| `Ports/Provider/PlainLanguageDrafter` (F89, L22) | `Assistance/Infrastructure/Adapter/Communication/AssistancePublicationPlainLanguageDrafter` | brouillon « En clair » (`POST /api/communication/manage/publications/plain-language`, `admin.communication.write`, rien n’est enregistré) ; champ `plainLanguage` (600 caractères) de la publication, validé à l’enregistrement — non testé |
| `Ports/Provider/AudienceProvider` | `Citizen/Infrastructure/Adapter/Communication/CitizenAudienceProvider` | quartier et consentement du citoyen connecté |

Câblage : autoload `Communication\` (et `Tests\Communication\` réservé), services, routes, mapping Doctrine `Communication`, règles `PUBLIC_ACCESS` en lecture dans `security.yaml`, tables `communication_publication` et `communication_alert` (migration `Version20261003003000`).

## Questions ouvertes

- Notifications par e-mail en plus de l’application.
- Recommandations par audience (aujourd’hui une seule liste par alerte).
- Expiration automatique signalée en temps réel (aujourd’hui : rafraîchissement de secours).
- Images des publications (F60, L17) : aucun téléversement aujourd’hui (texte seulement). S’il est ajouté, limiter poids et dimensions côté API et produire des variantes WebP/AVIF — voir [sobriété du site](../../../../front/apps/site/doc/sobriete.md#images-et-médias-f60).

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Administration](../../Administration/doc/README.md)
- [Citizen](../../Citizen/doc/README.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin — contenus](../../../../front/apps/admin/doc/contenus.md)
- [Site — vitrine et alertes](../../../../front/apps/site/doc/vitrine-et-alertes.md)
- [Site — sobriété et performance](../../../../front/apps/site/doc/sobriete.md)
<!-- backlinks:end -->
