# Montée en charge et sauvegardes

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Architecture](README.md) › Montée en charge et sauvegardes
<!-- navigation:end -->

Réglages d’exploitation des lots L24 et L25 ([ADR 012](decisions/012-montee-en-charge-integrite-anti-abus.md)). **État : livré, non testé ; aucun test de charge n’a été exécuté.**

## Tâches planifiées (cron cPanel)

Le worker Messenger tourne en continu dans cPanel › Workers (voir le [déploiement cPanel](deploiement-cpanel.md)), qui donne aussi la liste complète des tâches cron. Sans Workers, ajouter `* * * * * php bin/console messenger:consume async --time-limit=55 --memory-limit=128M`.

```cron
*/5 * * * *  php bin/console app:security:scan
15 * * * *   php bin/console app:realtime:purge --older-than=3600
30 2 * * *   php bin/console app:backup:run --verify
0 14 * * *   php bin/console app:backup:verify
```

Le worker envoie les e-mails et les alertes (dont l’avertissement « activité inhabituelle » au citoyen). La vérification de l’après-midi relit la sauvegarde de la nuit : un fichier altéré entre-temps passe en « Échec » dans l’admin.

## Variables d’environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PLATFORM_DEGRADED` | `auto` | `on` force le mode allégé, `off` coupe la détection automatique |
| `PLATFORM_SLOW_MS` | `2500` | une réponse plus lente compte comme « tension » |
| `PLATFORM_SLOW_THRESHOLD` | `40` | tensions par minute qui déclenchent le mode allégé (0 = jamais) |
| `PLATFORM_AUTO_MINUTES` | `5` | durée d’un mode allégé automatique |
| `REALTIME_MAX_STREAMS` | `200` | flux SSE ouverts par fenêtre de 20 s (≈ simultanés) ; au-delà, `503` et actualisation régulière |
| `REALTIME_STREAM_SECONDS` | `20` | durée d’une connexion SSE (ADR 004) ; à baisser si les processus PHP manquent |
| `BACKUP_DIR` | `var/backups` | dossier des sauvegardes, **hors du dossier public** |
| `BACKUP_RETENTION` | `7` | sauvegardes conservées |
| `BACKUP_RESTORE_MAX_ROWS` | `200000` | au-delà, relecture sans restauration d’essai |
| `BACKUP_MAX_AGE_HOURS` | `36` | une sauvegarde plus ancienne passe « à surveiller » |

Routes, durées de cache, formulaires protégés et tables sauvegardées : `api/config/packages/platform.yaml`.

## Mode allégé (F77)

- Activer : `php bin/console app:platform:degraded on --reason="Alerte cyclonique"` ; lever : `app:platform:degraded off` ; état : `app:platform:degraded status`.
- Suspendu (`503`, `Retry-After`, message français) : flux temps réel, Pilotage (statistiques), assistant IA (`/api/assistance/`), résumé IA des anomalies. Toujours servi : alertes, urgences, services, demandes, connexion.
- Le site passe en mode léger pour la visite (bandeau « Service en mode allégé », carte et direct coupés par L17) ; l’admin affiche l’état sur « Activité inhabituelle ».
- Page statique à servir par l’hébergeur en cas de panne complète : `front/apps/site/public/surcharge.html` (ex. `ErrorDocument 503 /surcharge.html`).

## Hébergement

- php-fpm : `pm.max_children` dimensionné pour flux SSE + requêtes (chaque flux tient un processus 20 s) ; garder un seul flux par onglet.
- OPcache activé, `APP_ENV=prod`, `composer dump-autoload --classmap-authoritative`, `php bin/console cache:warmup`.
- Les fronts sont statiques : laisser le serveur web servir `out/` et `dist/` avec cache long sur les fichiers versionnés.
- Le cache applicatif (`var/cache/prod/pools`) doit être partagé entre la CLI et php-fpm (même utilisateur) pour que l’interrupteur du mode allégé soit vu par tous.

## Test de charge

```bash
scripts/load/charge.sh http://localhost:8083/api 2000 50
```

`ab` si installé, sinon `curl` en parallèle. Le script refuse toute adresse non locale (sauf `ALLOW_REMOTE=1` pour une préproduction dédiée) : **ne jamais viser la production**. Lire : `X-Cache: HIT` sur les lectures répétées, temps moyens, absence de `5xx`, et `X-Platform-Mode` si le seuil de tension est atteint.

## Sauvegarde et restauration (F87)

- Sauvegarde : `php bin/console app:backup:run [--verify]` → `BACKUP_DIR/<AAAAMMJJTHHMMSSZ>/` (`manifest.json` + une archive `<table>.ndjson.gz` par table), rapport dans `BACKUP_DIR/reports/`.
- Vérification : `php bin/console app:backup:verify [identifiant]` → sommes SHA-256, relecture complète, colonnes comparées au schéma actuel, restauration d’essai en tables temporaires, verdict **OK / À surveiller / Échec**, visible dans l’admin (« Sauvegardes », `admin.backup.read`).
- **Restauration réelle** (incident) :
  1. Mettre le site en mode allégé ou en maintenance, arrêter le cron du worker.
  2. Choisir la dernière sauvegarde « OK » dans l’admin et copier son dossier sur le serveur.
  3. Remettre le schéma : `php bin/console doctrine:migrations:migrate` sur une base vide (même version de code que la sauvegarde, sinon lire les écarts de colonnes du rapport).
  4. Pour chaque table du manifeste, dans l’ordre des BC : `zcat <table>.ndjson.gz` et insérer chaque ligne JSON (les valeurs `{"__b64": …}` sont binaires, à décoder). Un script d’import dédié reste à écrire (question ouverte) ; en attendant, l’import peut se faire avec `php bin/console dbal:run-sql` ligne à ligne ou un petit script PHP reprenant `BackupVerifier::insertBatch`.
  5. Remettre la même `DATA_ENCRYPTION_KEY` qu’au moment de la sauvegarde, puis relancer le worker et `app:backup:verify`.
- Copier régulièrement `BACKUP_DIR` hors du serveur (sauvegarde de l’hébergeur). Les sauvegardes ne sont jamais commitées (`api/.gitignore`).

## Questions ouvertes

- Aucune mesure de charge réelle ; seuils par défaut à ajuster après un essai.
- Pas de commande d’import automatisée (`app:backup:restore`) : la restauration réelle reste manuelle.
- Cache public et état du mode allégé par serveur (pas de pool partagé).

<!-- backlinks:start -->
---

[← Retour à Architecture](README.md)

**Référencé depuis :**

- [ADR 012](decisions/012-montee-en-charge-integrite-anti-abus.md)
- [Shared](../../api/src/Shared/doc/README.md)
- [Admin — sécurité](../../front/apps/admin/doc/securite.md)
- [Chantier](../chantier/README.md)
- [Déploiement cPanel](deploiement-cpanel.md)
<!-- backlinks:end -->
