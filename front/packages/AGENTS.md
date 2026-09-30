# Agent frontend — packages partagés

- shared-ui : composants, icônes, styles et primitives d’interface.
- shared-utils : outils réellement réutilisables, sans dépendance aux applications.
- shared-config : configurations communes de compilation et de qualité.

Ne pas importer `apps/*` depuis un package. Ne pas y placer une règle métier d’une seule app pour contourner ses ports. Préserver les exports publics et vérifier les applications consommatrices lors d’un changement de contrat ou de style partagé.

Ne pas réintroduire d’utilitaire local d’authentification : l’autorité de connexion est IAM via le site.
