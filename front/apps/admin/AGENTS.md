# Agent frontend Admin

Lire [la documentation de l’application](doc/README.md) et les documents des BC qu’elle référence.

Application d’administration React/Vite, React Router, Redux Toolkit et RTK Query. Respecter le kernel et l’injection de dépendances dans `modules/shared/core/config`, ainsi que la chaîne endpoints RTK → use cases → ports gateway → adaptateurs.

Modules : `auth`, `admin` (BC Administration : rôles, membres), `pilotage` (BC Pilotage : flux de l’API du concours), `citizen-accounts` (BC Citizen : comptes citoyens, L8), `security` (BC IAM : journal des connexions, L8), `audit` (BC Audit : journal des actions, L12 — [détail](doc/journal-des-actions.md)), `shared`. Le module `pilotage` porte aussi le suivi des demandes Webcup et le tableau de bord de l’activité (F50). Les modules internes affichés dans le sélecteur (`admin`, `pilotage`) ne sont pas les destinations IAM du site : l’application entière correspond à la destination `admin`.
Modules : `auth`, `admin` (BC Administration : rôles, membres), `content` (BC Communication : publications, alertes ; BC Administration : services et transports — [contenus](doc/contenus.md)), `pilotage` (BC Pilotage : flux de l’API du concours), `shared`. Les modules internes affichés dans le sélecteur (`admin`, `pilotage`) ne sont pas les destinations IAM du site : l’application entière correspond à la destination `admin`.

Accessibilité (L4, [détail](doc/accessibilite.md)) : chaque layout d’espace rend `AdminContent` (`shared/ui/layout/admin-content.tsx` : en-tête, fil d’Ariane, « Affichage », `main#contenu`, focus sur le `h1` après navigation) ; une nouvelle page ajoute son chemin dans `shared/ui/layout/breadcrumbs.ts` et un seul `h1`. Statuts avec `StatusBadge` de `@boilerplate/shared-ui/components/a11y`, erreurs reliées aux champs (`aria-describedby`, `aria-invalid`), libellés sans jargon.

Entre modules : le consommateur définit son port (ex. `admin/core/application/ports/provider/access-session.provider.ts`), le module fournisseur l’implémente dans `core/infrastructure/adapter/<consommateur>` et le kernel l’injecte. Ne pas importer le store, les gateways concrètes ou les modèles d’un autre module.

Connexion : aucun formulaire local. Garder les gardes, la redirection `VITE_SITE_URL` et la vérification du profil par `AuthHttpGateway`. `/auth/start` et `/auth/callback` passent par la gateway PKCE. Un 401 invalide la session et vide les caches ; une panne réseau ou un 403 ne déconnecte pas.

Tests : `pnpm --filter admin test --run` ; lint : `pnpm --filter admin lint` ; build : `pnpm --filter admin build`. Vérifier les états chargement, vide, erreur avec nouvelle tentative et refus.
