# Site — connexion unique

Next.js App Router (export statique), Redux Toolkit et RTK Query. Le site porte le seul formulaire de connexion, affiche les espaces autorisés et transmet un code à usage unique à l’admin.

## Démarrer

```bash
cp .env.example .env
pnpm --filter site dev --port 5178
```

| Variable | Valeur locale |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8083/api` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:5178` |
| `NEXT_PUBLIC_ADMIN_URL` | `http://localhost:5179` |

Ces variables sont requises au build et déjà fournies dans `docker/compose.dev.yaml`. Compte initial : `php bin/console app:admin:bootstrap` depuis `api/` → **admin@example.com** / **password**.

## Fonctionnement

- `/login` : `AuthHttpGateway` appelle `/api/login_check` ; le JWT est conservé derrière `AuthSessionGateway` (localStorage, clé `app.site.jwt`).
- `/` : accueil public avec lien de connexion ; après connexion, liste des espaces (`/api/iam/me/spaces`) avec skeletons, état vide, erreur et nouvelle tentative ; revérifiée chaque minute.
- `/sso` : reçoit la demande PKCE de l’admin, appelle `/api/iam/portal-codes` et redirige vers le callback configuré.
- Un 401 supprime la session ; la déconnexion vide la session et le cache, synchronisés entre onglets.

Contenu de la page d’accueil : texte de remplacement à adapter au produit.

[Parcours détaillé](doc/parcours-connexion.md)
