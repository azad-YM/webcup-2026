# Nova Terra — plateforme de la ville

Cœur numérique de Nova Terra, première ville humaine fondée sur une autre planète. Les habitants y accèdent aux services municipaux, s’informent, contactent la mairie, signalent un problème et suivent leurs demandes ; les agents disposent d’un espace de travail pour les traiter. Le projet est réalisé pendant les **24H By Webcup 2026** : les besoins de la ville arrivent par vagues via l’API du concours ([contexte](doc/contexte/README.md), [chantier](doc/chantier/README.md)).

Le dépôt part d’un socle full-stack DDD / hexagonal : API Symfony découpée en bounded contexts, site public Next.js qui porte la connexion unique, application d’administration React et packages frontend partagés.

## État actuel

- **Livré** :
  - connexion JWT sur le site et liste des espaces accessibles ;
  - passage vers l’admin par code à usage unique et PKCE ;
  - rôles, permissions et membres de l’administration ;
  - création du premier administrateur par CLI ;
  - tests unitaires et applicatifs (MySQL 8.4 Testcontainers), Vitest côté front.
- **À construire** : espace citoyen, demandes citoyennes, services et publications, accessibilité, multilingue, consultation du flux Webcup. Voir le [chantier](doc/chantier/README.md).

## Organisation du dépôt

```text
.
├── api/                         API Symfony
│   └── src/
│       ├── IAM/                 comptes, connexion, passage site → admin, espaces
│       ├── Administration/      membres, rôles, permissions (+ services, publications)
│       ├── Citizen/             citoyens et demandes (documentation, code à créer)
│       └── Shared/              primitives et kernel communs aux BC
├── doc/                         contexte produit, architecture, décisions, chantier
├── docker/                      environnements Docker Compose
└── front/                       monorepo pnpm
    ├── apps/admin/              espace de travail des agents (React/Vite)
    ├── apps/site/               portail des habitants (Next.js, connexion unique)
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

1. Backend : créer le BC sur le modèle d’`api/src/Administration` (couches, tests, `doc`, `AGENTS.md`), puis suivre [Ajouter un module](api/README.md#ajouter-un-module).
2. Frontend : créer le module sur le modèle de `front/apps/admin/src/modules/admin`, déclarer sa gateway dans le kernel, son API RTK dans le store et ses routes.
3. Documenter le BC dans son dossier `doc` et le relier à l’[index](doc/README.md).

## Documentation

- [Index de la documentation](doc/README.md)
- [Contexte produit](doc/contexte/README.md) · [Chantier](doc/chantier/README.md)
- [Architecture technique](doc/technique/architecture.md)
- [API](api/README.md)
- [Frontend](front/README.md)
- Consignes des agents : [AGENTS.md](AGENTS.md)
