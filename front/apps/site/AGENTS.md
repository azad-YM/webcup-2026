# Agent frontend Site

Lire [la documentation de l’application](doc/README.md), ses parcours et les documents IAM et Citizen qu’elle référence.

Portail des habitants de Nova Terra : vitrine (`public`), connexion et inscription (`auth`), espace citoyen (`citizen`), socle (`shared`). Next.js App Router avec export statique (pas de route dynamique : paramètres d’URL), Redux Toolkit et RTK Query. Les usages navigateur sont dans des composants clients après initialisation ; le store est créé par instance dans `StoreProvider`, qui compose aussi les adaptateurs. Ne pas importer le code de l’admin.

Entre modules du site : port chez le consommateur, adaptateur dans `core/infrastructure/adapter/<consommateur>` du fournisseur, injection dans `StoreProvider` ; un écran qui réunit deux modules se compose dans `src/app/*/page.tsx` par props (slots). Pas d’import du store, des gateways concrètes ou de l’UI d’un autre module.

Parcours à préserver :

- `/` public ; en-tête avec Connexion / Créer un compte ou Mon espace / Déconnexion ; fil d’Ariane sur chaque page hors accueil ; lien d’évitement et `main#contenu`.
- `/connexion` connecte via le use case, sauvegarde via `AuthSessionGateway`, puis va vers `/espace` ou la destination `?retour=` (liste fermée). `/login` redirige vers `/connexion` (l’admin l’utilise).
- `/inscription` : compte (`POST /api/citizen/register` puis `login_check`), puis « Mes informations » que l’on peut passer. `PUT /api/citizen/me` remplace tout le profil : envoyer les six champs.
- `/espace` : garde session puis `GET /api/citizen/me` ; `404` → message « compte non citoyen » et espaces IAM ; carte « Administration » conservée, une carte unique reste sélectionnable sans redirection automatique. La présence d’un jeton ne prouve pas les accès.
- Accessibilité (L4, [détail](doc/accessibilite.md)) : bouton « Affichage » de l’en-tête, préférences via `SiteAccessibilityProvider` (gateways locales de `@boilerplate/shared-ui/a11y`, jamais de `localStorage` direct) et script de `<head>` sans flash ; statuts avec `StatusBadge` (jamais la couleur seule) ; champs via `form-field.tsx` (label, aide, erreur reliée) ; libellés en langage clair (« demande », « numéro de suivi ») et termes difficiles ajoutés au glossaire `/aide/glossaire` ; astuces `ContextualTip` courtes et refermables.
- États chargement / vide / erreur avec « Réessayer » distincts ; un `401` ferme la session et vide les caches (`resetAccountCaches`), une panne réseau non.
- Services (Administration), actualités et alertes (Communication) viennent de l’API (`HttpPublicContentGateway`, `AlertsHttpGateway`) ; le flux temps réel du module `public` passe par le port `CityFeedGateway` (un seul flux SSE, rouvert à chaque changement de session) avec un `pollingInterval` de secours de 60 s. Les adaptateurs locaux ne servent plus qu’aux tests. Voir [vitrine et alertes](doc/vitrine-et-alertes.md).

Destinations IAM : `admin` (ajouter une entrée dans `SpaceCode`, `spaces-list.tsx`, `env.ts` et `/sso` pour une nouvelle application). Ne jamais transmettre de JWT dans une URL ; `/sso` ne redirige que vers le callback configuré.

Commandes : `pnpm --filter site test`, `pnpm --filter site lint`, `pnpm --filter site build` (variables `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`). Ne pas committer `out/` après un build local.
