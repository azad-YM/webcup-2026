# Boilerplate

Socle applicatif full-stack prêt à accueillir un produit : API Symfony découpée en bounded contexts (DDD / hexagonal), site public Next.js portant la connexion unique, application d’administration React et packages frontend partagés.

Le dépôt ne contient **aucun métier réel**. Le BC `Example` et le module frontend `example` sont des tranches verticales fictives, complètes et testées, à dupliquer pour démarrer un nouveau domaine.

## Ce qui est fourni

- **Authentification centralisée** : login JWT sur le site, liste des espaces accessibles, passage vers l’admin par code à usage unique + PKCE (aucun JWT dans une URL).
- **Administration** : rôles, catalogue de permissions, membres d’administration, création du premier administrateur par CLI.
- **Exemple de module métier** : CRUD d’éléments (`Item`) avec commandes/queries Messenger, événement de domaine, autorisation via un port intermodule, tests unitaires et HTTP.
- **Socle de tests** : unitaires sans Docker, applicatifs sur MySQL 8.4 Testcontainers ; Vitest côté front.

## Organisation du dépôt

```text
.
├── api/                         API Symfony
│   └── src/
│       ├── IAM/                 BC identité et accès : comptes, sessions, rôles, permissions
│       ├── Example/             BC d’exemple (Item)
│       └── Shared/              primitives et kernel communs aux BC
├── doc/                         architecture et décisions transverses
├── docker/                      environnements Docker Compose
└── front/                       monorepo pnpm
    ├── apps/admin/              application d’administration React/Vite
    ├── apps/site/               site public Next.js (connexion unique)
    └── packages/                shared-ui, shared-utils, shared-config
```

## Stack

- PHP 8.2+, Symfony 7.3, Doctrine ORM, Messenger, LexikJWT ;
- MySQL 8.4 ;
- React 19, Vite, React Router, Redux Toolkit / RTK Query pour l’admin ;
- Next.js 15 pour le site ;
- TypeScript, pnpm workspaces, Tailwind CSS 4, Vitest ;
- Docker Compose, Nginx, PHP-FPM.

## Démarrage

### Avec Docker

```bash
cp api/.env.example api/.env
docker compose -f docker/compose.dev.yaml up --build
docker compose -f docker/compose.dev.yaml exec api php bin/console lexik:jwt:generate-keypair --skip-if-exists
docker compose -f docker/compose.dev.yaml exec api php bin/console app:admin:bootstrap
```

En développement, l’entrypoint de l’API crée la base et synchronise le schéma depuis les mappings. Les migrations (`api/migrations`) servent aux environnements persistants.

| Service | Adresse locale |
|---|---|
| Site (connexion) | `http://localhost:5178` |
| Admin | `http://localhost:5179` |
| API | `http://localhost:8083` |
| MySQL | `localhost:3338` |

Compte initial créé par `app:admin:bootstrap` : **admin@example.com** / **password** (options `--email` et `--password` pour les changer).

### Sans Docker

Une instance MySQL 8.4 doit être accessible ; adapter `DATABASE_URL` (hôte `127.0.0.1` au lieu de `db`).

```bash
cd api
cp .env.example .env
composer install
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:migrate -n
php bin/console app:admin:bootstrap

cd ../front
pnpm install
pnpm --filter site dev --port 5178
pnpm --filter admin dev --port 5179
```

## Vérifications

```bash
cd api && php bin/phpunit                 # Docker requis pour le groupe Application
cd front && pnpm --filter admin test --run && pnpm --filter site test
```

## Démarrer un nouveau domaine

1. Backend : copier `api/src/Example` sous un nouveau BC, renommer namespaces, routes, mapping et table, puis suivre [Ajouter un module](api/README.md#ajouter-un-module).
2. Frontend : copier `front/apps/admin/src/modules/example`, déclarer sa gateway dans le kernel, son API RTK dans le store et ses routes.
3. Documenter le BC dans son dossier `doc` et le relier à l’[index](doc/README.md).

## Documentation

- [Index de la documentation](doc/README.md)
- [Architecture technique](doc/technique/architecture.md)
- [API](api/README.md)
- [Frontend](front/README.md)
- Consignes des agents : [AGENTS.md](AGENTS.md)
