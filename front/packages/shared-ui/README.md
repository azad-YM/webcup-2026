# Shared UI

Package de primitives visuelles partagées par l’admin et le site.

## Exports

| Import | Contenu |
|---|---|
| `@boilerplate/shared-ui/global.css` | styles globaux et Tailwind CSS |
| `@boilerplate/shared-ui/components` | composants React publics |
| `@boilerplate/shared-ui/lib` | utilitaires de composition de classes |
| `@boilerplate/shared-ui/components/icon` | icônes lucide et `CompanyLogo` (logo de remplacement `logo.svg`) |
| `@boilerplate/shared-ui/hooks` | `useForm`, `useWatch`, `toast` |

## Ajouter un composant

1. Créer le composant dans `src/components/`.
2. L'exporter depuis `src/components/index.ts`.
3. Garder son API indépendante d'un domaine métier.
4. Privilégier les props contrôlables et les primitives accessibles.
5. Ajouter un nouvel export dans `package.json` uniquement si un point d'entrée distinct est réellement nécessaire.

Le package doit rester consommable aussi bien par Vite que par Next.js.
