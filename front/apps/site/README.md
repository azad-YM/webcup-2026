# Site — portail des habitants de Nova Terra

Next.js App Router (export statique), Redux Toolkit et RTK Query. Le site présente la ville (services, actualités), porte le seul formulaire de connexion et l’inscription citoyenne, offre l’espace citoyen, affiche les espaces autorisés et transmet un code à usage unique à l’admin.

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

- `/connexion` : `AuthHttpGateway` appelle `/api/login_check` ; le JWT est conservé derrière `AuthSessionGateway` (localStorage, clé `app.site.jwt`). `/login` redirige vers `/connexion`.
- `/inscription` : `CitizenHttpGateway` appelle `/api/citizen/register`, puis connexion automatique et étape facultative « Mes informations » (`PUT /api/citizen/me`).
- `/espace`, `/espace/profil` : profil citoyen (`/api/citizen/me`) et liste des espaces IAM (`/api/iam/me/spaces`, revérifiée chaque minute).
- `/`, `/services`, `/actualites` : vitrine, sur **contenu de démonstration local** jusqu’au lot L3.
- `/sso` : reçoit la demande PKCE de l’admin, appelle `/api/iam/portal-codes` et redirige vers le callback configuré.
- Un 401 supprime la session ; la déconnexion vide la session et les caches, synchronisés entre onglets.

[Documentation de l’application](doc/README.md) · [Parcours de connexion](doc/parcours-connexion.md) · [Parcours citoyen](doc/parcours-citoyen.md)
