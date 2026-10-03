# Admin

Application d’administration React 19 / Vite. Elle n’a pas de formulaire de connexion : la session est obtenue depuis le site par code à usage unique + PKCE.

## Stack

TypeScript, React 19, Vite 7, React Router 7, Redux Toolkit / RTK Query, Tailwind CSS 4 via `@boilerplate/shared-ui`, Vitest.

## Commandes

```bash
pnpm --filter admin dev --port 5179
pnpm --filter admin test --run
pnpm --filter admin lint
pnpm --filter admin build
```

## Configuration

```bash
cp .env.example .env.local
```

| Variable | Description | Valeur locale |
|---|---|---|
| `VITE_API_BASE_URL` | Racine des endpoints API | `http://localhost:8083/api` |
| `VITE_SITE_URL` | Site portant la connexion | `http://localhost:5178` |

## Structure

```text
src/
├── app/
│   ├── main.tsx              bootstrap React, providers, synchro de session entre onglets
│   └── routes.tsx            routes et garde de session
└── modules/
    ├── auth/                 échange de code PKCE, profil, espaces internes, adaptateurs de session
    ├── admin/                layout Administration, tableau de bord, rôles (BC Administration)
    └── shared/               kernel (dépendances), store, use cases, composants de navigation
```

Chaque module suit `core/{domain,application,infrastructure}` et `ui/{layouts,pages,sections,modals}`.

## Ajouter un module

1. Créer le module sur le modèle de `modules/admin` : types, port de session, gateway, API RTK et pages.
2. Déclarer la gateway dans `shared/core/config/dependencies.ts` et l’instancier dans `kernel.ts`.
3. Ajouter le reducer et le middleware de son API RTK dans `store.ts`.
4. Déclarer ses routes dans `app/routes.tsx` et, s’il s’agit d’un espace, son entrée dans `module-switcher.tsx`, `list-spaces.hook.ts` et `AuthHttpGateway.listSpaces`.
5. Si le module appelle l’API, définir son port de session et son adaptateur dans `auth/core/infrastructure/adapter/<module>`.

Documentation fonctionnelle : [doc/README.md](doc/README.md).
