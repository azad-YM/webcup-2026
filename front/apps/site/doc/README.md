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

## Organisation cible

Le site réunit trois zones, chacune portée par un module `src/modules/<module>` :

| Zone | Module | Routes | Public | Backend | Demandes |
|---|---|---|---|---|---|
| Vitrine officielle | `public` | `/`, `/services`, `/actualites`, bandeau d’alerte | Tout le monde | [Administration](../../../../api/src/Administration/doc/README.md) (lot L3, L7) | D07, D05, D06, F28, F32, D18, F29 |
| Connexion et inscription | `auth` | `/connexion`, `/inscription` (2 étapes) ; `/login` redirige vers `/connexion` | Visiteurs | [IAM](../../../../api/src/IAM/doc/README.md), [Citizen](../../../../api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1) | D01, D03 |
| Espace citoyen | `citizen` | `/espace`, `/espace/profil`, puis `/espace/demandes` (L2) | Citoyens connectés | [Citizen](../../../../api/src/Citizen/doc/README.md) | D03, D12, D11, D04, F25, F26, F30 |

Socle commun (module `shared`) : en-tête et navigation, pied de page, fil d’Ariane (D15), réglages d’accessibilité (F21, F23, F24).

- La garde de l’espace citoyen exige une session, puis un profil citoyen (`GET /api/citizen/me`). Un compte non citoyen, par exemple un agent, voit un message et le lien vers l’administration.
- Un membre de l’administration connecté garde l’accès à la carte « Administration » (liste des espaces IAM). Le passage vers l’admin reste en PKCE.
- Export statique : pas de route dynamique ; utiliser des paramètres d’URL (`/espace/demandes?ref=…`).

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
