# Site — portail des habitants

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › site
<!-- navigation:end -->

Le site est la porte d’entrée publique de Nova Terra. Il porte la connexion unique, et deviendra le portail des habitants : présentation de la ville et de ses services, actualités, inscription, espace personnel et suivi des demandes.

Aujourd’hui, toute personne peut consulter l’accueil, puis se connecter une seule fois pour voir les espaces auxquels son compte a accès et les ouvrir sans ressaisir ses identifiants. L’accueil est encore un texte de remplacement (D07).

## Utilisateurs et objectifs

- Visiteur : consulter l’accueil public et choisir de se connecter.
- Personne disposant d’un compte : se connecter, voir ses espaces, ouvrir l’administration si elle en est membre.
- Personne sans espace : rester connectée et voir un état « aucun espace disponible ».

Cible : visiteur qui s’inscrit (D01), citoyen qui retrouve son espace personnel, envoie et suit ses demandes (D03, D04, D11, D16, F25, F26), consulte services et publications (D05, D06, F28, F32), reçoit les alertes de la ville (D18, F29, F30, F31), avec accessibilité, fil d’Ariane et choix de la langue (F21, F23, F24, D15, D14). Suivi dans le [chantier](../../../../doc/chantier/README.md).

## Livré

Connexion HTTP, garde de session, cartes issues de l’API, états chargement / vide / erreur, déconnexion locale et passage PKCE vers l’admin. Détails : [parcours de connexion](parcours-connexion.md).

## Backend propriétaire

- [IAM](../../../../api/src/IAM/doc/README.md) : comptes, sessions et espaces.
- [Citizen](../../../../api/src/Citizen/doc/README.md) (cible) : inscription citoyenne, demandes.
- [Administration](../../../../api/src/Administration/doc/README.md) (cible) : services et publications.

[Installation et commandes](../README.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Admin](../../admin/doc/README.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
- [Citizen](../../../../api/src/Citizen/doc/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
<!-- backlinks:end -->
