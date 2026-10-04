# Frontend — socle commun

Workspace pnpm. Applications indépendantes dans `apps`, composants et outils partagés dans `packages`. Lire le README, le `AGENTS.md` et le `doc/README.md` de l’application concernée, puis les documents des BC propriétaires référencés.

## Architecture des modules

Respecter la structure existante `modules/<module>/core/{domain,application,infrastructure}` et `ui/{pages,sections,modals,…}` ; créer seulement les dossiers utiles.

- UI : affichage, formulaires, navigation et états de chargement. Extraire les comportements complexes dans des hooks locaux.
- RTK Query : endpoints, cache et invalidation via les use cases et `withUseCase` existants.
- Use cases : orchestration, dépendances injectées et ports gateway dans `core/application/ports/gateway`.
- Infrastructure : gateways locales ou HTTP implémentant ces ports. Pas d’accès fetch/localStorage/iframe dispersé dans les composants.
- Composition dans le kernel Vite ou le provider Next.js ; conserver la signature des use cases de l’application, qui n’est pas identique entre site et admin.

Ne jamais importer le code interne d’une autre application ni lire son stockage navigateur. Entre modules métier, garder la même frontière que le backend : port chez le consommateur, adaptateur dans l’infrastructure du module fournisseur et injection dans la composition. Ne pas importer son store, ses gateways concrètes ou ses modèles métier dans le consommateur. Les packages communs exposent leurs entrées publiques.

## Interface et données

Réutiliser `@boilerplate/shared-ui`, ses composants, icônes et styles. Conserver les conventions visuelles et les libellés français. Formulaires accessibles, états loading/empty/error distincts, nouvelle tentative en cas d’erreur temporaire, boutons de soumission protégés contre les doubles envois.

Garder les capacités retournées par l’API comme source pour l’interface ; les contrôles serveur restent obligatoires. Nettoyer les caches lors d’un changement de compte ou de périmètre. Ne pas confondre données locales de démonstration et règles backend validées.

## Sobriété (L17)

Ne pas alourdir le premier chargement : composant lourd ou rare (fenêtre, carte, assistant, éditeur, graphique, contenu réservé aux personnes connectées) chargé à la demande (`next/dynamic`, `React.lazy`) ; `@boilerplate/shared-ui` importé par sous-chemin (`components/shadcn/<composant>`, `components/a11y`, `components/icon`) plutôt que par le baril `components` ; aucune police web ; images avec dimensions, `loading="lazy"`, `decoding="async"`, WebP/AVIF. Côté site, rafraîchissement de secours via `polling(ms)` (`shared/ui/sobriety/polling.ts`), éléments décoratifs marqués `data-decorative`, formulaires de saisie longue marqués `data-brouillon="<clé>"`. Mesure : `node scripts/ecoindex.mjs` ([détail](apps/site/doc/sobriete.md)).

## Authentification

`site` porte l’unique formulaire. Les autres apps conservent leurs gardes et redirigent via `VITE_SITE_URL`. L’admin valide sa session auprès d’IAM. Ne pas réintroduire de login local, jeton constant accepté, passerelle iframe ou contournement de garde.

Le passage site → admin utilise un code à usage unique avec PKCE ; une nouvelle application suit le même protocole avec sa propre destination. La révocation commune reste à livrer. Aucun JWT dans une URL. Un `401` invalide la session concernée ; une panne réseau ne doit pas être assimilée à une déconnexion. L’autorisation d’un espace et celle de chaque opération restent distinctes.

## Vérification depuis front/

Lancer les tests pertinents, le lint du périmètre et le build de l’app modifiée. `pnpm --filter admin test --run` pour l’admin ; `pnpm --filter site test` pour le site. Vérifier les autres consommateurs si un package partagé change. Les répertoires `dist`, `out`, `.next`, caches et `node_modules` ne sont pas des sources à modifier ou inclure dans un commit.
