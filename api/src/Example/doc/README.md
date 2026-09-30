# Documentation — Example

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Example
<!-- navigation:end -->

Example est un BC **fictif** : il ne sert aucun utilisateur réel. Il montre, sur une ressource simple (`Item`), l’ensemble des conventions du socle afin d’être dupliqué pour un nouveau domaine. Son consommateur est le module `example` de l’[admin](../../../../front/apps/admin/doc/README.md).

## Modèle

`Item` : `id`, `name` (1–120 caractères, trimé, unique sans tenir compte de la casse), `description` (≤ 1000), `status` (`active` | `archived`), `createdAt` (horloge injectée). La création enregistre l’événement `ItemCreated` ; la reconstitution n’en produit pas.

## Cas d’usage

| Type | Classe | Route | Permission |
|---|---|---|---|
| Query | `ListItems` (filtre `?status=`) | `GET /api/example/items` | `admin.item.read` |
| Query | `GetItem` | `GET /api/example/items/{id}` | `admin.item.read` |
| Commande | `CreateItem` | `POST /api/example/items` `{name, description}` | `admin.item.write` |
| Commande | `UpdateItem` | `PUT /api/example/items` `{id, name, description, status}` | `admin.item.write` |
| Commande | `DeleteItem` | `DELETE /api/example/items` `{id}` | `admin.item.write` |

Réponses : vue `{id, name, description, status, createdAt}` ; 401 sans session, 403 sans permission, 404 élément inconnu, 422 payload ou règle invalide (nom dupliqué, statut inconnu). Aucun refus ne persiste de modification ni d’événement.

## Autorisation

Example définit le port `ItemAccessPolicy` ; [IAM](../../IAM/doc/membres-et-habilitations.md) l’implémente avec `AdminItemAccessPolicy`.

## Ce que montrent les tests

- `Unit/Entity/ItemTest` : invariants et événements de l’agrégat.
- `Unit/Command/ItemCommandsTest`, `Unit/Query/ItemQueriesTest` : handlers avec `RamItemRepository`, `StubItemAccessPolicy`, `SequenceIdProvider`.
- `Application/ItemOperationsTest` : vraie route, Messenger, adaptateur IAM, Doctrine et file `async`.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Architecture technique](../../../../doc/technique/architecture.md)
- [IAM](../../IAM/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
<!-- backlinks:end -->
