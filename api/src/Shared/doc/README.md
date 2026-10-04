# Documentation — Shared

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Shared
<!-- navigation:end -->


Shared est le socle technique commun aux BC, pas un domaine métier destiné à un utilisateur final. Il accueille les primitives réellement communes, l’infrastructure partagée et le support de tests utilisé entre plusieurs BC.

Il ne centralise ni leurs entités ni leurs règles, et ne sert pas de raccourci pour appeler leurs repositories. Les parcours transverses présents ici sont des scénarios de composition et de recette.

**État actuel :** kernel, `AppController`, `ExceptionListener`, exceptions de domaine, `AggregateRoot`, ports `IClock` / `IIdProvider`, port du journal des actions `AuditTrail` (implémenté par le BC [Audit](../../Audit/doc/README.md), appelé par les handlers de mutation d’Administration, Communication, Citizen, Pilotage et par le limiteur de connexion d’IAM — [ADR 006](../../../../doc/technique/decisions/006-journal-des-actions.md)), port temps réel `RealtimePublisher`, choisi par `REALTIME_TRANSPORT` via `RealtimePublisherFactory` : transport `database` par défaut (table `realtime_event`, flux SSE `GET /api/realtime/stream`, tickets `POST /api/realtime/tickets`, ports `RealtimeAudienceProvider` et `RealtimeAccountProvider`, commandes `app:realtime:purge` et `app:realtime:publish`), adaptateurs Mercure et Pusher optionnels ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md) ; double `RecordingRealtimePublisher` pour les tests des consommateurs) et support de tests Symfony/Testcontainers. Le modèle `Role`, autrefois placé ici, appartient désormais à [Administration](../../Administration/doc/README.md).

## Support et conventions

- [Capacités transverses à cadrer](capacites-transverses.md)
- [Conventions techniques](conventions.md)
- [Environnements et exploitation](environnements.md)
- [Format des cas d’usage](rediger-un-cas-usage.md)

## Protection des données (L20/F69 — non testé)

Primitives techniques communes, décrites par l’[ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md) ; Shared ne connaît aucun BC.

| Élément | Rôle | Consommateurs |
|---|---|---|
| `Infrastructure/Http/SecurityHeadersListener` | En-têtes de sécurité de toutes les réponses (`nosniff`, `no-referrer`, `DENY`, `Permissions-Policy`, CSP de l’API, `no-store` si authentifié, HSTS en prod HTTPS) | Toute l’API |
| `Infrastructure/RateLimit/RateLimitListener` + `DatabaseRateLimiter` | Limitation par IP et par nom de route, table `rate_limit_counter` (migration `Version20261003120200`), `429` en français avec `Retry-After` | Routes listées dans `config/packages/security_hardening.yaml` (IAM, Citizen) ; désactivé en test |
| `Infrastructure/Doctrine/EncryptedStringType` (`encrypted_string`) | Chiffrement au repos libsodium ; clé `DATA_ENCRYPTION_KEY`, sinon dérivée d’`APP_SECRET`, fournie au démarrage par `Kernel::boot()` | Citizen (téléphone, adresse) |
| `Application/Listener/ExceptionListener` | Hors debug, `500` sans détail technique | Toute l’API |

## Modèle de langage (demandes « IA » — non testé)

Port `Shared\Application\Ports\Service\LanguageModel` : `isAvailable()` et `complete(system, user, maxTokens): ?string`. Adaptateur `Shared\Infrastructure\LanguageModel\AnthropicLanguageModel` (API Claude, modèle `ANTHROPIC_MODEL`, par défaut Claude Haiku 4.5). La clé `ANTHROPIC_API_KEY` reste côté serveur dans `api/.env.local` ; elle n'est jamais envoyée au front.

- Sans clé, en cas d'erreur, de délai dépassé ou de réponse vide, `complete()` renvoie `null` : chaque consommateur applique **son propre repli local** (mots-clés, synonymes, règles) et reste utilisable.
- Réponses identiques mises en cache une heure (coût et charge), échecs mis en cache 30 s.
- Les journaux ne contiennent ni le prompt ni la réponse. Les consommateurs n'envoient que les données nécessaires à la tâche, sans identité du citoyen.

Consommateurs prévus : BC Assistance (D10, F90, F91, F92), Citizen (F75, demandes similaires), Audit/Shared (F85, activité inhabituelle).

## Architecture commune

[Architecture](../../../../doc/technique/architecture.md) · [Frontières et accès inter-BC](../../../../doc/technique/decisions/002-frontieres-et-acces.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Architecture transverse](../../../../doc/technique/README.md)
- [ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)
- [Administration](../../Administration/doc/README.md)
- [Administration — membres et habilitations](../../Administration/doc/membres-et-habilitations.md)
- [ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md)
<!-- backlinks:end -->
