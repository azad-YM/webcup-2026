# Sobriété et performance (site)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Sobriété et performance
<!-- navigation:end -->

Lot L17 du [chantier](../../../../doc/chantier/README.md) : F57, F58, F59, F60, F61, F62. **🟡 Code livré, non testé, non vérifié dans un navigateur** (ni service worker ni mode léger essayés en conditions réelles). Page publique : `/sobriete` (« Une plateforme plus légère », lien dans le pied de page).

## Pour qui, pourquoi

Habitants équipés d’un téléphone ancien, d’une connexion lente, chère ou intermittente : le site doit se charger vite, rester utilisable hors ligne pour l’essentiel (urgences, services, actualités) et ne jamais faire perdre une démarche en cours. Moins de données transférées et moins de calcul côté appareil, c’est aussi moins d’énergie consommée.

## Diagnostic (F57)

Mesure locale, reproductible, sans service extérieur : `node scripts/ecoindex.mjs [--json fichier]` depuis `front/apps/site`, après `pnpm build` (variables de `.env.example`). Le script lit l’export `out/` (il n’y écrit rien) et calcule pour chaque page principale :

- le poids du premier chargement (HTML + JS + CSS + polices + images référencés), brut, gzip et brotli ; les scripts `nomodule` (polyfills ignorés par les navigateurs récents) et les images `loading="lazy"` sont exclus ;
- le nombre de requêtes et le nombre d’éléments du DOM rendu statiquement ;
- un score EcoIndex avec la formule publique (quantiles DOM, requêtes, poids gzip en Ko ; `100 − 5 × (3·qDOM + 2·qRequêtes + qPoids) / 6`).

Limites de la mesure : DOM avant hydratation et avant les données de l’API ; appels à l’API et modules chargés à la demande non comptés (c’est l’objectif : ils ne sont téléchargés que s’ils servent). Le score EcoIndex dépend surtout du DOM : il bouge peu, le gain porte sur le poids.

### Avant / après (4 octobre 2026, export statique local)

| Page | Requêtes avant → après | DOM | gzip avant → après (Ko) | brotli avant → après (Ko) | JS gzip avant → après (Ko) | EcoIndex avant → après |
|---|---|---:|---|---|---|---|
| Accueil | 20 → 18 | 339 | 257.6 → 212.2 (-18 %) | 222.9 → 182.4 | 231.1 → 185.5 (-20 %) | 80 (B) → 80 (B) |
| Services | 21 → 19 | 193 | 260.0 → 217.7 (-16 %) | 225.3 → 187.5 | 235.4 → 192.9 (-18 %) | 85 (A) → 85 (A) |
| Fiche service (`?service=`) | 21 → 19 | 193 | 260.0 → 217.7 (-16 %) | 225.3 → 187.5 | 235.4 → 192.9 (-18 %) | 85 (A) → 85 (A) |
| Actualités | 20 → 17 | 191 | 253.5 → 206.7 (-18 %) | 219.5 → 177.8 | 228.9 → 182.0 (-20 %) | 85 (A) → 86 (A) |
| Urgences | 21 → 18 | 279 | 257.6 → 210.8 (-18 %) | 223.1 → 181.4 | 231.8 → 184.9 (-20 %) | 82 (A) → 82 (A) |
| Carte | 21 → 19 | 243 | 258.8 → 215.7 (-17 %) | 224.3 → 185.7 | 233.5 → 190.2 (-19 %) | 83 (A) → 84 (A) |
| Connexion | 21 → 18 | 192 | 260.6 → 213.4 (-18 %) | 225.8 → 183.7 | 236.0 → 188.7 (-20 %) | 85 (A) → 86 (A) |
| Espace citoyen | 20 → 18 | 203 | 255.0 → 215.3 (-16 %) | 220.7 → 185.3 | 230.4 → 190.4 (-17 %) | 85 (A) → 85 (A) |

`next build` (« First Load JS ») : accueil 190 → 172 kB, services 182 → 166 kB, actualités 175 → 155 kB, carte 180 → 163 kB, connexion 188 → 168 kB, espace 231 → 177 kB. CSS : 19 Ko gzip, une seule feuille Tailwind ; aucune police web.

Admin (Vite) : un seul fichier de 764 Ko (238 Ko gzip, avertissement « chunk > 500 kB ») → premier chargement d’environ 179 Ko gzip (`index` 38 + `react` 91 + `redux` 27 + `ui` 23), chaque page en morceau de 1 à 9 Ko gzip chargé à sa première visite ; plus d’avertissement.

Ce qui reste : React, le moteur Next et Redux Toolkit (≈ 150 Ko gzip communs à toutes les pages) ; l’internationalisation au client impose des pages client.

## Conception et chargement sobres, appareils peu puissants (F58, F61)

- **Chargé à la demande** : fenêtre « Affichage » (`display-preferences-dialog.tsx`, `React.lazy` dans `@boilerplate/shared-ui`), menu du compte (`shared/ui/layout/account-menu.tsx`), cloche des notifications et liste des espaces (`src/app/header-slots.tsx`, `next/dynamic`, uniquement pour une personne connectée), carte Leaflet (déjà à la demande depuis F45). Les primitives Radix (Popover, Dialog, Popper) ne sont plus dans le premier chargement.
- **Pas de barils** : `@boilerplate/shared-ui` déclare `"sideEffects": ["*.css"]` et expose `components/shadcn/*` ; le site importe `…/components/shadcn/popover` plutôt que `…/components`.
- **Polices et CSS** : police système (`ui-sans-serif, system-ui`), aucune police téléchargée ; une seule feuille Tailwind générée ; pied de page en `content-visibility: auto`.
- **Animations** : coupées si `prefers-reduced-motion`, par le réglage « Réduire les animations » et en mode léger.
- **Mises à jour** : `polling(ms)` (`shared/ui/sobriety/polling.ts`) remplace les `pollingInterval` des écrans : pas d’appel onglet caché (`skipPollingIfUnfocused`, `setupListeners` dans `StoreProvider` suit `visibilitychange`), intervalle ×4 en mode léger. Le temps réel reste un seul flux SSE.
- **Admin** : pages en `React.lazy` dans `app/routes.tsx` (fonction `page()` avec un état de chargement), bibliothèques séparées par `manualChunks` dans `vite.config.ts`.

## Mode léger (F62)

Case « Mode léger » du panneau « Affichage » (`showLightMode`, site seulement), mémorisée par la gateway L4 (`lightMode` dans `DisplayPreferences`, appliqué avant le premier affichage par le script de `<head>` : `html[data-light="on"]`). Effets :

- CSS (`global.css`) : ni animation ni transition, pas d’ombres, flous ou dégradés, éléments `[data-decorative]` masqués (formes de l’accueil) ;
- carte : jamais ouverte d’office, remplacée par la liste (« Afficher la carte quand même » reste possible) ;
- pas de temps réel (`SseRealtimeSubscriber` ne s’ouvre pas) et rafraîchissement de secours quatre fois plus espacé.

Toutes les informations, liens et démarches restent présents. Proposition automatique (`ConnectionStatus`) si `navigator.connection.saveData`, réseau `2g`/`slow-2g` ou débit < 0,5 Mb/s ; refus mémorisé comme indication vue (`mode-leger-propose`). **Mode dégradé du serveur** : un `503` d’une API publique vu par le service worker, ou l’événement navigateur `nova-terra:mode-degrade` (constante `DEGRADED_MODE_EVENT`, à émettre par un adaptateur quand l’API annonce une surcharge — contrat à raccorder avec L24), active le mode léger pour la visite seulement, avec « Revenir à l’affichage complet ».

## Connexion très lente ou coupée (F59)

- **Service worker minimal** `public/sw.js` (enregistré en production par `ConnectionStatus`) : fichiers `/_next/static/` en cache d’abord ; pages réseau d’abord avec repli après 8 s sur la dernière version (pages essentielles préchargées : accueil, services, actualités, urgences, carte, bienvenue, connexion, sobriété) ; données publiques de l’API (`administration/services|districts`, `communication/publications|alerts`, listes publiques de participation) réseau d’abord, une nouvelle tentative après 1,5 s, puis dernière réponse lue. **Jamais de requête avec `Authorization`** ni du flux SSE. Page « Hors ligne » minimale si rien n’est enregistré.
- **Messages** (bandeau `role="status"` sous l’en-tête) : « La connexion est lente, nous réessayons… », « Hors ligne — informations du JJ/MM à HHhMM » (date de la réponse enregistrée), « Connexion rétablie ». Les écrans gardent leurs squelettes et « Réessayer » ; le rafraîchissement de secours reprend seul.
- **Brouillons** : `FormDrafts` conserve sur l’appareil la saisie des formulaires marqués `data-brouillon` (nouvelle demande, inquiétude, idée, consultation), la restaure s’ils sont rouverts (« Effacer le brouillon » proposé), l’oublie après un envoi réussi (formulaire quitté ou vidé), au bout de 7 jours et à la déconnexion. Jamais de mot de passe, code à usage unique ni fichier. Port `FormDraftGateway`, adaptateur `LocalStorageFormDraftGateway`.

## Images et médias (F60)

Le site n’affiche aucune image matricielle : emblème et pictogrammes en SVG en ligne (Lucide), aucun média décoratif ; rien à convertir en WebP/AVIF. Règle pour l’avenir : `width`/`height` explicites, `loading="lazy"` et `decoding="async"` hors du premier écran, formats WebP/AVIF ; `img { height: auto }` dans `nova-terra.css`. Le script de mesure ignore les images `loading="lazy"`. **Communication** : les publications n’ont pas de téléversement d’image (texte seulement) ; si un téléversement est ajouté, il devra limiter poids et dimensions côté API — voir [Communication](../../../../api/src/Communication/doc/README.md#questions-ouvertes).

## Limites et questions ouvertes

- Rien n’a été testé ni vérifié dans un navigateur : service worker (mise à jour, portée, CSP), restauration des brouillons dans les champs contrôlés par React, proposition du mode léger.
- Le brouillon est oublié si le formulaire est vidé ou quitté après l’envoi ; un formulaire qui reste rempli après un succès garde son brouillon jusqu’à 7 jours.
- Listes longues : « Mes demandes » et les listes publiques ne sont pas encore paginées côté API ; à reprendre si les volumes grandissent.
- Le mode dégradé serveur n’a pas encore de signal dédié de l’API (en-tête exposé) : seul le `503` ou l’événement navigateur le déclenchent.

[Retour au site](README.md)

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Accessibilité (site)](accessibilite.md)
- [Admin](../../admin/doc/README.md)
- [Communication](../../../../api/src/Communication/doc/README.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
