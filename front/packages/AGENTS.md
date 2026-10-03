# Agent frontend — packages partagés

- shared-ui : composants, icônes, styles et primitives d’interface. Accessibilité (L4) : `@boilerplate/shared-ui/a11y` (module pur : ports et gateways locales des préférences d’affichage et des indications vues, script de démarrage sans flash) et `@boilerplate/shared-ui/components/a11y` (`AccessibilityPreferencesProvider`, `DisplayPreferencesButton`/`Panel`, `SkipLink`, `BreadcrumbTrail`, `StatusBadge`, `ContextualTip`, `FirstVisitGuide`, `ErrorSummary`, `FieldErrorText`, `LiveAnnouncer`, `LoadingStatus`). `global.css` porte le focus visible, la taille du texte (`html[data-text-size]`), le contraste élevé (`html[data-contrast=high]`) et la réduction des animations (`html[data-motion=reduce]`). Pages : [site](../apps/site/doc/accessibilite.md), [admin](../apps/admin/doc/accessibilite.md).
- shared-utils : `getErrorMessage` traduit les erreurs techniques (réseau, statuts HTTP) en phrases simples et garde les messages rédigés par l’API.
- shared-utils : outils réellement réutilisables, sans dépendance aux applications.
- shared-config : configurations communes de compilation et de qualité.

Ne pas importer `apps/*` depuis un package. Ne pas y placer une règle métier d’une seule app pour contourner ses ports. Préserver les exports publics et vérifier les applications consommatrices lors d’un changement de contrat ou de style partagé.

Ne pas réintroduire d’utilitaire local d’authentification : l’autorité de connexion est IAM via le site.
