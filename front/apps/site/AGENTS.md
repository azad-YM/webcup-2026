# Agent frontend Site

Lire [la documentation de l’application](doc/README.md) et les documents IAM qu’elle référence.

Point d’entrée unique de connexion et de choix d’espace. Next.js App Router avec export statique, Redux Toolkit et RTK Query. Les usages navigateur sont dans des composants clients après initialisation ; le store est créé par instance dans `StoreProvider`. Ne pas importer le code de l’admin.

Parcours à préserver : rendre `/` public, proposer `/login` aux visiteurs non connectés, connecter via le use case, sauvegarder via `AuthSessionGateway`, revenir à `/`, charger les espaces avec skeletons, traiter liste vide et erreurs. Une carte unique reste sélectionnable, sans redirection automatique. La présence d’un jeton ne prouve pas les accès.

Destinations IAM : `admin` (ajouter une entrée dans `SpaceCode`, `spaces-list.tsx`, `env.ts` et `/sso` pour une nouvelle application). Ne jamais transmettre de JWT dans une URL ; `/sso` ne redirige que vers le callback configuré.

Commandes : `pnpm --filter site test`, `pnpm --filter site lint`, `pnpm --filter site build` (variables `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`).
