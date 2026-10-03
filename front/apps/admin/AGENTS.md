# Agent frontend Admin

Lire [la documentation de l’application](doc/README.md) et les documents des BC qu’elle référence.

Application d’administration React/Vite, React Router, Redux Toolkit et RTK Query. Respecter le kernel et l’injection de dépendances dans `modules/shared/core/config`, ainsi que la chaîne endpoints RTK → use cases → ports gateway → adaptateurs.

Modules : `auth`, `admin` (BC Administration : rôles, membres), `content` (BC Communication : publications, alertes ; BC Administration : services et transports — [contenus](doc/contenus.md)), `pilotage` (BC Pilotage : flux de l’API du concours), `shared`. Les modules internes affichés dans le sélecteur (`admin`, `pilotage`) ne sont pas les destinations IAM du site : l’application entière correspond à la destination `admin`.

Entre modules : le consommateur définit son port (ex. `admin/core/application/ports/provider/access-session.provider.ts`), le module fournisseur l’implémente dans `core/infrastructure/adapter/<consommateur>` et le kernel l’injecte. Ne pas importer le store, les gateways concrètes ou les modèles d’un autre module.

Connexion : aucun formulaire local. Garder les gardes, la redirection `VITE_SITE_URL` et la vérification du profil par `AuthHttpGateway`. `/auth/start` et `/auth/callback` passent par la gateway PKCE. Un 401 invalide la session et vide les caches ; une panne réseau ou un 403 ne déconnecte pas.

Tests : `pnpm --filter admin test --run` ; lint : `pnpm --filter admin lint` ; build : `pnpm --filter admin build`. Vérifier les états chargement, vide, erreur avec nouvelle tentative et refus.
