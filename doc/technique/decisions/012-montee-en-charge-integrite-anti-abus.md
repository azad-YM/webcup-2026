# ADR 012 — Montée en charge, intégrité et anti-abus

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 012
<!-- navigation:end -->

- Statut : accepté, livré (lots L24 : F77, F78, F87 et L25 : F81, F82, F85 — non testé, non vérifié dans un navigateur)
- Date : 2026-10-04
- Complète : [ADR 004](004-temps-reel.md) (temps réel), [ADR 006](006-journal-des-actions.md) (journal), [ADR 007](007-protection-des-donnees.md) (limiteur, en-têtes, CSP)

## Contexte

Six demandes visent la robustesse : rester utilisable en surcharge (F77) et sous forte affluence (F78), prouver que les sauvegardes se restaurent (F87), bloquer les robots (F81) et les envois multiples (F82), repérer l’activité inhabituelle et les données incohérentes avec une réaction perceptible (F85, IA). Contraintes : hébergement mutualisé PHP + MySQL (cPanel, cron, pas de processus permanent ni de Redis), fronts exportés en statique, aucun service tiers (captcha, monitoring), aucun nouveau paquet, frontières BC strictes.

## Options étudiées

1. **Services externes** (CDN applicatif, captcha hébergé, APM, sauvegarde gérée) : interdits par l’infrastructure du concours et coûteux en données personnelles.
2. **Tout dans chaque BC** (cache, idempotence, anti-robot dupliqués) : répétitif, incohérent d’un écran à l’autre.
3. **Protections transverses dans Shared, configurées par nom de route** (comme le limiteur de l’ADR 007), **détection dans Audit alimentée par des ports**. Retenu.

## Décision

### Shared : protections déclarées par configuration (`config/packages/platform.yaml`)

Shared ne connaît aucun BC : chaque protection lit une liste de routes ou de préfixes dans la configuration de composition.

| Besoin | Mécanisme | Emplacement |
|---|---|---|
| F78 lectures publiques | cache serveur étiqueté (`public_read.cache`) des GET **anonymes** listés, `ETag` + `304`, `Cache-Control: public, max-age`, invalidation par segment `/api/<segment>/` à chaque écriture réussie ; durée ×4 en mode allégé | `Shared/Infrastructure/Http/PublicReadCacheListener` |
| F78 flux SSE | plafond `REALTIME_MAX_STREAMS` (compté par le limiteur en base par fenêtre de connexion) → `503` + `Retry-After` aléatoire ; `retry:` SSE avec gigue ; côté client, réouverture espacée (doublement plafonné à 2 min + aléa) | `RealtimeController`, `shared-utils/realtime` |
| F78 index | publications et alertes par état, connexions et appareils par date | migration `Version20261004120300` |
| F77 mode allégé | état dans un pool de cache (aucun SQL ajouté au chemin critique) : `PLATFORM_DEGRADED=on`, `app:platform:degraded on|off`, ou détection automatique (≥ 40 réponses lentes ou 5xx dans la minute → 5 min) ; préfixes non essentiels → `503` + `Retry-After` + message français ; en-tête `X-Platform-Mode` sur toute réponse ; `GET /api/platform/status` | `Shared/Infrastructure/Platform` |
| F81 robots | champ piège (`X-Form-Trap`), jeton de formulaire HMAC horodaté (`GET /api/forms/token`, délai minimal par formulaire), et **seulement en cas de doute** un défi en langage clair (`428`, « Combien font 3 + 4 ? », réponse en chiffres ou en lettres) ; refus et défis comptés | `Shared/Infrastructure/FormGuard` |
| F82 envois multiples | `Idempotency-Key` : réservation avant le contrôleur, réponse 2xx conservée 24 h et **rejouée** (`Idempotent-Replayed: true`), `409` pendant le traitement, `422` si la clé sert à un autre contenu ; clé liée à la route et à la session ; routes rendant un jeton exclues | `Shared/Infrastructure/Idempotency`, table `idempotency_keys` |
| F81/F85 signaux | `429` du limiteur et refus/défis des formulaires écrits dans `abuse_signals` (client = condensé HMAC, jamais l’IP) ; lus par le port Shared `AbuseSignals` | `Shared/Infrastructure/AbuseSignal` |
| F87 sauvegardes | `app:backup:run` (export NDJSON gzip par table, instantané cohérent, SHA-256, manifeste, rétention) et `app:backup:verify` (sommes, relecture, colonnes, **restauration d’essai** en tables temporaires, verdict OK / à surveiller / échec) ; rapports JSON lus par `GET /api/platform/backups` (port `OperationsAccessPolicy`, `admin.backup.read`) | `Shared/Infrastructure/Backup` |

**Exception assumée (F87)** : la sauvegarde lit des tables de tous les BC. C’est un outil d’exploitation au niveau de la base, équivalent à `mysqldump` : aucune règle métier, aucune classe d’un BC importée, liste de tables déclarée dans la configuration, lecture seule, écriture uniquement dans des tables temporaires de session. Elle ne doit jamais servir à un cas d’usage.

### Audit : détecteur d’activité inhabituelle (F85)

- Audit possède `audit_anomalies` (empreinte unique, gravité, explication française, éléments liés, statut nouvelle / vue / traitée, réaction).
- Sources **par ports**, aucune requête sur les tables d’un autre BC : `AccountSignalsProvider` et `AccountProtector` (implémentés par IAM), `CitizenSignalsProvider` (Citizen, qui lit le catalogue des services par son propre port vers Administration), `AbuseSignals` (Shared), journal `audit_entries` (propre table).
- Règles explicables et seuils constants (`UnusualActivityDetector`) : pic de verrouillages, compte visé, adresse qui essaie de nombreux comptes, nombreux appareils nouveaux, compte suspendu encore utilisé ou encore actif, rafales freinées, robots, rafale d’envois d’un habitant, masse de changements par un agent, affichages répétés de données sensibles, demande close sans étape, rendez-vous sur service désactivé, références en double, compteurs négatifs, soutiens orphelins, créneaux bloqués.
- **Réaction perceptible** : compte attaqué → IAM verrouille 15 min (réutilise F37), exige le code par e-mail 24 h même sur un appareil de confiance (F53, `auth_users.code_required_until`), prévient le titulaire dans son espace (`security.unusual_activity`) ; journalisé `audit.anomaly.protected`.
- Analyse par `app:security:scan` (cron 5 min) ou bouton « Analyser maintenant » ; nouvelle anomalie grave publiée sur `administration.security` (`security.anomaly_detected`), écouté par les membres `admin.security.read`.
- **IA** : le port `LanguageModel` rédige seulement le résumé du jour, à partir des règles et compteurs (aucune donnée personnelle) ; repli par règles, source affichée. L’IA ne décide d’aucune détection ni réaction.

### Front

- `@boilerplate/shared-utils/submission-guard` : contexte d’envoi lu par `ApiClient` (en-têtes ajoutés aux écritures, réponse consignée), clé d’idempotence = formulaire + contenu + sel de l’onglet (un retour arrière renvoie la même clé).
- `@boilerplate/shared-ui/components/a11y` : `useProtectedSubmit` et `FormProtection` (champ piège invisible, question accessible, « Ce formulaire est protégé contre les envois automatiques », message « déjà envoyée »).
- `@boilerplate/shared-utils/platform-status` : `X-Platform-Mode` ou `GET /api/platform/status` émettent `nova-terra:mode-degrade`, raccordé au mode léger temporaire du site (L17) ; page statique `public/surcharge.html`.

## Conséquences

- Écritures en plus par envoi protégé : une réservation et une mise à jour d’idempotence ; un signal seulement en cas de refus. Purges opportunistes (1 % / 0,5 %).
- Le cache public est **par serveur** (fichiers) ; plusieurs serveurs exigeraient un pool partagé (Redis, base). L’invalidation par segment est large mais sûre ; la durée courte borne les publications programmées.
- Le mode allégé et la tension sont mesurés par serveur ; la CLI et php-fpm doivent partager `var/cache` (même utilisateur).
- Les réponses rejouées sont conservées 24 h en base (pas pour les routes à jeton ni la fiche d’accueil qui contient un code provisoire).
- Le défi anti-robot est stateless : une bonne réponse reste réutilisable 10 minutes (bornée par le limiteur).
- Les sauvegardes contiennent les empreintes de mots de passe et les champs chiffrés : dossier 0700, à copier hors du serveur par l’hébergeur ; la clé `DATA_ENCRYPTION_KEY` se sauvegarde à part.
- Réglages et procédure : [Montée en charge et sauvegardes](../montee-en-charge.md).

<!-- backlinks:start -->
---

[← Retour aux décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Montée en charge et sauvegardes](../montee-en-charge.md)
- [Shared](../../../api/src/Shared/doc/README.md)
- [Audit](../../../api/src/Audit/doc/README.md)
- [IAM — connexion renforcée](../../../api/src/IAM/doc/connexion-renforcee.md)
- [Admin — sécurité](../../../front/apps/admin/doc/securite.md)
- [Site — sobriété](../../../front/apps/site/doc/sobriete.md)
- [Chantier](../../chantier/README.md)
<!-- backlinks:end -->
