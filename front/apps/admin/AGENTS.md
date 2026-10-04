# Agent frontend Admin

Lire [la documentation de l’application](doc/README.md) et les documents des BC qu’elle référence.

Application d’administration React/Vite, React Router, Redux Toolkit et RTK Query. Respecter le kernel et l’injection de dépendances dans `modules/shared/core/config`, ainsi que la chaîne endpoints RTK → use cases → ports gateway → adaptateurs.

Modules : `auth`, `admin`, `content`, `requests`, `pilotage`, `citizen-accounts`, `security`, `audit`, `participation` (BC Participation, L19 — [détail](doc/participation.md)), `shared`. L’enveloppe commune est composée dans `app/backoffice-layout.tsx` : rail des modules Administration / Demandes citoyennes / Pilotage / Participation, navigation secondaire et `AdminContent`. Les contenus de la ville appartiennent visuellement à Administration. Les modules internes ne sont pas des destinations IAM : l’application entière correspond à `admin`. Voir [navigation et habillage](doc/navigation.md).

Le menu du compte est fourni par `auth/ui/components/account-menu.tsx` ; Auth consomme `CitizenWorkspaceProvider`, implémenté par `citizen-accounts/core/infrastructure/adapter/auth/HttpCitizenWorkspaceProvider`, injecté dans le kernel. Il vérifie `GET /citizen/me` avant d’afficher l’espace citoyen. Un retour vers le site utilise sa session existante, sans transfert de JWT.

Accessibilité (L4, [détail](doc/accessibilite.md)) : l’enveloppe commune rend `AdminContent` (`shared/ui/layout/admin-content.tsx` : en-tête, fil d’Ariane, « Affichage », `main#contenu`, focus sur le `h1` après navigation) ; une nouvelle page ajoute son chemin dans `shared/ui/layout/breadcrumbs.ts` et un seul `h1`. Statuts avec `StatusBadge` de `@boilerplate/shared-ui/components/a11y`, erreurs reliées aux champs (`aria-describedby`, `aria-invalid`), libellés sans jargon.

Entre modules : le consommateur définit son port (ex. `admin/core/application/ports/provider/access-session.provider.ts`), le module fournisseur l’implémente dans `core/infrastructure/adapter/<consommateur>` et le kernel l’injecte. Ne pas importer le store, les gateways concrètes ou les modèles d’un autre module.

Connexion : aucun formulaire local. Garder les gardes, la redirection `VITE_SITE_URL` et la vérification du profil par `AuthHttpGateway`. `/auth/start` et `/auth/callback` passent par la gateway PKCE. Un 401 invalide la session et vide les caches ; une panne réseau ou un 403 ne déconnecte pas.

Tests : `pnpm --filter admin test --run` ; lint : `pnpm --filter admin lint` ; build : `pnpm --filter admin build`. Vérifier les états chargement, vide, erreur avec nouvelle tentative et refus.
