# Frontend workspace

<!-- navigation:start -->
[Accueil du projet](../README.md) › Frontend
<!-- navigation:end -->

Monorepo pnpm réunissant deux applications et trois packages partagés.

```text
front/
├── apps/
│   ├── admin/             React, Vite, React Router, Redux Toolkit / RTK Query
│   └── site/              Next.js App Router (connexion unique)
└── packages/
    ├── shared-config/     configurations TypeScript
    ├── shared-ui/         styles, composants et icônes React
    └── shared-utils/      client HTTP, erreurs, décorateurs de cas d’usage
```

## Installation et commandes

Depuis `front/` :

```bash
pnpm install

pnpm --filter admin dev --port 5179
pnpm --filter admin test --run
pnpm --filter admin lint
pnpm --filter admin build

pnpm --filter site dev --port 5178
pnpm --filter site test
pnpm --filter site lint
pnpm --filter site build
```

## Packages partagés

- `@boilerplate/shared-config` centralise les options TypeScript.
- [`@boilerplate/shared-ui`](packages/shared-ui/README.md) expose styles globaux, composants (shadcn), icônes (lucide) et logo de remplacement.
- [`@boilerplate/shared-utils`](packages/shared-utils/README.md) contient les utilitaires techniques indépendants des applications.

N’ajoutez pas dans ces packages une règle propre à une seule application ou à un seul domaine.

## Variables d’environnement

| Application | Variables |
|---|---|
| admin | `VITE_API_BASE_URL`, `VITE_SITE_URL` (voir `apps/admin/.env.example`) |
| site | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` (voir `apps/site/.env.example`) |

## Documentation des applications

- [site](apps/site/doc/README.md)
- [admin](apps/admin/doc/README.md)

<!-- backlinks:start -->
---

[← Retour à l’accueil du projet](../README.md)

**Référencé depuis :**

- [Utilitaires frontend partagés](packages/shared-utils/README.md)
<!-- backlinks:end -->
