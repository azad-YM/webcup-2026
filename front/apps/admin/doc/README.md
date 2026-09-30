# Admin — administration de l’application

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › admin
<!-- navigation:end -->

L’admin est l’application des personnes qui administrent le produit : elles gèrent les rôles et, dans le module d’exemple, des éléments fictifs. Elle s’ouvre depuis la carte « Administration » du [site](../../site/doc/README.md), sans nouvelle saisie des identifiants.

## Parcours

1. Depuis le site, la personne ouvre l’espace Administration : l’admin échange un code PKCE contre sa session (voir le [parcours de connexion](../../site/doc/parcours-connexion.md)).
2. `AuthHttpGateway` charge le profil (`/api/iam/me`) et vérifie la présence de l’espace `admin` ; sinon, un message propose de revenir au site.
3. `/espaces` liste les modules internes (Administration, Exemple) ; le sélecteur de la barre latérale permet d’en changer.

## Modules

| Module | Routes | Backend propriétaire | Statut |
|---|---|---|---|
| Administration | `/admin`, `/admin/role`, `/admin/member` | [IAM](../../../../api/src/IAM/doc/README.md) | Rôles livrés ([détail](roles.md)) ; membres à venir |
| Exemple | `/example/items` | [Example](../../../../api/src/Example/doc/README.md) | CRUD livré, gateway HTTP |

### Module Exemple

Liste des éléments avec états chargement / vide / erreur + « Réessayer », création et modification dans une modale (nom, description, statut en édition), suppression confirmée. Le formulaire signale un nom déjà utilisé avant l’envoi ; l’API reste l’autorité (422 affiché tel quel). Les erreurs 401, 403, 404 et réseau sont traduites par `ItemHttpGateway` ; seul le 401 invalide la session.

Tests : règles de domaine (`item.test.ts`), use cases via le store RTK avec `InMemoryItemGateway`, contrat HTTP (`item.http.test.ts`).

## Limites

La déconnexion est locale ; la révocation commune reste à concevoir. Les droits affichés ne remplacent pas les contrôles serveur.

[Installation et commandes](../README.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Site](../../site/doc/README.md)
- [Example](../../../../api/src/Example/doc/README.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
<!-- backlinks:end -->
