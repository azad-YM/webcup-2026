# Site — connexion et choix de l’espace

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › site
<!-- navigation:end -->

Le site est la porte d’entrée publique du produit. Toute personne peut consulter l’accueil, puis se connecter une seule fois pour voir les espaces auxquels son compte a accès et les ouvrir sans ressaisir ses identifiants. Son contenu d’accueil est un texte de remplacement à adapter.

## Utilisateurs et objectifs

- Visiteur : consulter l’accueil public et choisir de se connecter.
- Personne disposant d’un compte : se connecter, voir ses espaces, ouvrir l’administration si elle en est membre.
- Personne sans espace : rester connectée et voir un état « aucun espace disponible ».

## Livré

Connexion HTTP, garde de session, cartes issues de l’API, états chargement / vide / erreur, déconnexion locale et passage PKCE vers l’admin. Détails : [parcours de connexion](parcours-connexion.md).

## Backend propriétaire

[IAM](../../../../api/src/IAM/doc/README.md) — comptes, sessions et espaces.

[Installation et commandes](../README.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Admin](../../admin/doc/README.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
<!-- backlinks:end -->
