# Déploiement sur cPanel

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Architecture](README.md) › Déploiement cPanel
<!-- navigation:end -->

Procédure manuelle d’hébergement de Nova Terra sur un compte cPanel mutualisé (sans Docker). **État : procédure rédigée, pas encore exécutée sur le serveur.**

| Application | Adresse | Racine du domaine (document root) | Contenu |
|---|---|---|---|
| API Symfony | `https://api.adumillion.lescomores.webcup.hodi.cloud` | `~/nova-terra/api/public` | code PHP complet dans `~/nova-terra/api` |
| Site (Next, export statique) | `https://adumillion.lescomores.webcup.hodi.cloud` | `~/nova-terra/site` | contenu de `front/apps/site/out/` |
| Admin (Vite, SPA) | `https://admin.adumillion.lescomores.webcup.hodi.cloud` | `~/nova-terra/admin` | contenu de `front/apps/admin/dist/` |

Les chemins `~/nova-terra/...` sont des exemples ; garder le code de l’API **hors** du dossier public (seul `api/public` est exposé).

## Déploiement par script

Le code arrive sur le serveur par GitHub ; `.env` et `.env.local` de l’API sont configurés une fois pour toutes sur le serveur.

1. **Fronts (poste)** : `scripts/deploy/build-fronts.sh` (ou `… site` / `… admin`) construit avec les URL de production, puis committer `front/apps/site/out` et `front/apps/admin/dist` (versionnés, `.htaccess` compris) et pousser.
2. **API (serveur, après récupération du code)** :

```sh
bash api/bin/deploy.sh --bootstrap-admin admin@<domaine> --seed-demo   # premier déploiement
bash api/bin/deploy.sh                                                 # mises à jour suivantes
```

`api/bin/deploy.sh` exécute avec `ea-php84` : `composer install --no-dev` (`ea-php84 /usr/local/bin/composer`), clés JWT si absentes, migrations, cache de production, administrateur (`--bootstrap-admin`, mot de passe demandé ou `ADMIN_PASSWORD`), jeu de démonstration (`--seed-demo`) et `messenger:stop-workers` (cPanel relance le worker avec le nouveau code). Autres binaires : variables `PHP_BIN` et `COMPOSER_PHAR`.

Les étapes ci-dessous détaillent ce que font les scripts, pour une installation à la main.

## 1. Préparer le compte cPanel

1. **Domaines** : créer les trois (sous-)domaines avec les racines ci-dessus, puis activer le certificat SSL (AutoSSL / Let’s Encrypt) pour chacun.
2. **PHP** (« Sélecteur de version PHP » ou MultiPHP) : PHP **8.4** pour l’API (objets paresseux natifs de Doctrine), avec `pdo_mysql`, `mbstring`, `intl`, `openssl`, `sodium`, `zlib`, `ctype`, `iconv`, `opcache`. `memory_limit` ≥ 256M.
3. **Base de données** (« Bases de données MySQL ») : créer la base et l’utilisateur (préfixés par le nom du compte), donner tous les privilèges. Relever la version dans phpMyAdmin : les migrations sont écrites et validées pour **MySQL 8.4** ; sur MariaDB, renseigner `serverVersion=mariadb-10.x.y` et surveiller la première migration.
4. **E-mail** : créer une adresse d’envoi (ex. `no-reply@…`) et noter son serveur SMTP.
5. **Terminal / SSH** : PHP s’appelle `ea-php84` (ex. `ea-php84 bin/console`), Composer `ea-php84 /usr/local/bin/composer` ; les tâches cron utilisent la même commande.

## 2. Installer l’API

Envoyer le dossier `api/` (Git de cPanel, `git clone`, ou archive) **sans** `vendor/`, `var/`, `.env.local` ni clés. Puis, dans `~/nova-terra/api` :

```sh
cp .env.example .env          # .env n'est pas versionné mais Symfony l'exige
nano .env.local               # valeurs de production, voir ci-dessous
composer install --no-dev --optimize-autoloader --classmap-authoritative
php bin/console lexik:jwt:generate-keypair     # clés dans config/jwt/, jamais commitées
php bin/console doctrine:migrations:migrate -n
php bin/console cache:clear && php bin/console cache:warmup
php bin/console app:admin:bootstrap --email=<e-mail admin> --password='<mot de passe fort>'
php bin/console app:demo:seed -n                # facultatif : jeu de démonstration
```

`.env.local` de production (ne jamais le committer) :

```dotenv
APP_ENV=prod
APP_DEBUG=0
APP_SECRET=<php -r "echo bin2hex(random_bytes(32));">
DATABASE_URL="mysql://<user>:<motdepasse>@localhost:3306/<base>?serverVersion=8.4.0&charset=utf8mb4"
MESSENGER_TRANSPORT_DSN="doctrine://default?auto_setup=0"
MAILER_DSN="smtps://no-reply%40<domaine>:<motdepasse>@<serveur-smtp>:465"
MAILER_FROM="Mairie de Nova Terra <no-reply@<domaine>>"
SITE_URL=https://adumillion.lescomores.webcup.hodi.cloud
CORS_ALLOW_ORIGIN='^https://(admin\.)?adumillion\.lescomores\.webcup\.hodi\.cloud$'
JWT_PASSPHRASE=<phrase forte, la même que lors de generate-keypair>
DATA_ENCRYPTION_KEY=<php -r "echo base64_encode(random_bytes(32));">
WEBCUP_API_KEY=<clé du concours>
ANTHROPIC_API_KEY=<clé facultative ; sans clé, replis locaux>
```

- `DATA_ENCRYPTION_KEY` chiffre les champs sensibles des citoyens : la sauvegarder hors du serveur ; la perdre rend ces données illisibles.
- `api/public/.htaccess` (versionné) réécrit les URL vers `index.php` et **transmet l’en-tête `Authorization`** ; sans lui, toutes les routes connectées répondent 401.
- Contrôle : `https://api…/api/platform/status` répond en JSON.

## 3. Worker Messenger (cPanel › Workers)

Les événements de domaine, notifications, e-mails et le temps réel passent par le transport `async`. Un worker supervisé remplace l’ancienne ligne cron `messenger:consume --time-limit=55`.

1. cPanel › **Workers** › *Ajouter un worker*.
2. Nom : `messenger` ; type : **Symfony Messenger** ; dossier : `~/nova-terra/api` (celui qui contient `bin/console`).
3. Files / transports : `async` (ne pas consommer `failed`).
4. Enregistrer : le worker démarre. **Le redémarrer après chaque déploiement de code** (il ne recharge pas le code seul).

Un seul processus suffit (1 vCore). Un état `FATAL` signifie que l’application ne démarre pas : lire le journal du worker (souvent `.env.local` ou base injoignable). Messages en échec : `php bin/console messenger:failed:show` puis `messenger:failed:retry`.

## 4. Tâches planifiées (cPanel › Tâches Cron)

Le worker ne remplace pas les tâches planifiées. Ajouter, en adaptant le chemin de PHP :

```cron
*/5  * * * *  cd ~/nova-terra/api && ea-php84 bin/console app:security:scan >> var/log/cron.log 2>&1
*/10 * * * *  cd ~/nova-terra/api && ea-php84 bin/console app:appointments:remind >> var/log/cron.log 2>&1
0    * * * *  cd ~/nova-terra/api && ea-php84 bin/console app:requests:reprioritize >> var/log/cron.log 2>&1
15   * * * *  cd ~/nova-terra/api && ea-php84 bin/console app:realtime:purge --older-than=3600 >> var/log/cron.log 2>&1
30   2 * * *  cd ~/nova-terra/api && ea-php84 bin/console app:backup:run --verify >> var/log/cron.log 2>&1
0   14 * * *  cd ~/nova-terra/api && ea-php84 bin/console app:backup:verify >> var/log/cron.log 2>&1
```

Réglages et rôle de chaque tâche : [montée en charge et sauvegardes](montee-en-charge.md), [rendez-vous](../../api/src/Citizen/doc/rendez-vous.md), [demandes à grande échelle](../../api/src/Citizen/doc/demandes-a-grande-echelle.md). Copier régulièrement `var/backups` hors du serveur.

## 5. Construire et envoyer les fronts

Les deux fronts sont statiques et se construisent **sur le poste** (Node 20+, pnpm 10), depuis `front/` :

```sh
pnpm install
pnpm --filter site build      # → front/apps/site/out/
pnpm --filter admin build     # → front/apps/admin/dist/
```

- Variables de build : site `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` ; admin `VITE_API_BASE_URL`, `VITE_SITE_URL`. Les placer dans `.env.production` (site) et `.env.production.local` (admin) plutôt que dans `.env` / `.env.local`, qui servent aussi au développement local.
- Envoyer **le contenu** de `out/` dans `~/nova-terra/site` et celui de `dist/` dans `~/nova-terra/admin`, fichiers cachés compris : les `.htaccess` (copiés depuis `public/`) gèrent la page 404 et la page de surcharge du site, et le routage de l’admin vers `index.html`.
- Contrôle : ouvrir le site, se connecter avec un citoyen de démonstration, puis l’admin avec l’administrateur.

## 6. Mise à jour du code

1. API : envoyer le code, `composer install --no-dev -o --classmap-authoritative`, `php bin/console doctrine:migrations:migrate -n`, `php bin/console cache:clear`, puis **redémarrer le worker** (`php bin/console messenger:stop-workers` ou depuis cPanel › Workers).
2. Fronts : reconstruire et remplacer le contenu des dossiers.

## Limites et points ouverts

- Procédure non exécutée sur le serveur cible ; MariaDB non validée.
- Flux temps réel (SSE) : chaque flux occupe un processus PHP 20 s ; si l’hébergeur met les réponses en tampon, le site retombe sur l’actualisation régulière.
- Pas de retour arrière automatisé : garder l’archive précédente et une sauvegarde de la base avant chaque migration.

<!-- backlinks:start -->
---
[← Retour à Architecture](README.md)

**Référencé depuis :**

- [Consignes communes](../../AGENTS.md)
- [Montée en charge et sauvegardes](montee-en-charge.md)
- [Environnements](../../api/src/Shared/doc/environnements.md)
- [Jeu de démonstration](../../api/src/Demo/doc/README.md)
<!-- backlinks:end -->
