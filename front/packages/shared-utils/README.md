# Utilitaires frontend partagés

<!-- navigation:start -->
[Frontend](../../README.md) › shared-utils
<!-- navigation:end -->

Ce package expose des primitives techniques sans dépendance aux applications,
à React ou à Redux. L’admin utilise les décorateurs de cas d’usage ;
les autres applications peuvent importer chaque outil par son entrée publique.

## Entrées publiques

| Import `@boilerplate/shared-utils/…` | Usage |
|---|---|
| `utility` | Vérification exhaustive avec `assertNever` |
| `api-client` | Client HTTP et `ApiHttpError` ; URL de base fournie au constructeur |
| `error.utils` | Extraction d’un message d’erreur |
| `random.id-provider` | Génération d’identifiants via `crypto.randomUUID()` |
| `use-cases.decorator` | Type générique `UseCase` et adaptateur `withUseCase` |
| `rtk-query.decorator` | Exécution et conversion des erreurs en résultat `USE_CASE_ERROR` |

`ApiClient` utilise les API standard `fetch`, `Response`, `FormData` et `Blob`.
L’application lit sa configuration d’environnement et fournit l’URL de base
ainsi que le fournisseur de jeton lorsqu’elle construit son client.
Ce client ne constitue pas une intégration IAM.

Les décorateurs conservent l’ordre `(dispatch, getState, dependencies, params)`.
`UseCase<P, R, State, Dependencies, Dispatch>` reçoit les types de l’application.
L’admin les spécialise dans `modules/shared/core/config/use-cases.ts`.
Le pont `withUseCase` suppose que l’API RTK Query reçoit les mêmes dépendances
via `thunk.extraArgument` et le même store que ceux déclarés dans ces types.
Les applications dont les signatures diffèrent conservent leur propre câblage.

<!-- backlinks:start -->
---

[← Retour au frontend](../../README.md)

**Référencé depuis :**

- [Frontend](../../README.md)
- [Admin](../../apps/admin/doc/README.md)
<!-- backlinks:end -->
