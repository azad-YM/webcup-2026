# Admin — espace de travail des agents

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › admin
<!-- navigation:end -->

L’admin est l’espace de travail des agents et des administrateurs de Nova Terra, distinct du portail des habitants. Les administrateurs y gèrent les rôles et les membres. Les agents y traiteront les demandes citoyennes, publieront les informations de la ville et consulteront le flux de l’API du concours (voir le [chantier](../../../../doc/chantier/README.md)). Elle s’ouvre depuis la carte « Administration » du [site](../../site/doc/README.md), sans nouvelle saisie des identifiants.

Livré : création des rôles, liste et ajout des membres ([membres](membres.md)), flux Nova Terra pour les agents ([pilotage](pilotage.md)), contenus de la ville — publications, alertes, services et transports ([contenus](contenus.md), non vérifié dans un navigateur).

## Parcours

1. Depuis le site, la personne ouvre l’espace Administration : l’admin échange un code PKCE contre sa session (voir le [parcours de connexion](../../site/doc/parcours-connexion.md)).
2. `AuthHttpGateway` charge le profil (`/api/iam/me`) et vérifie la présence de l’espace `admin` ; sinon, un message propose de revenir au site.
3. `/espaces` liste les modules internes (Administration, Pilotage) ; le sélecteur de la barre latérale permet d’en changer. L’accès à chaque opération reste contrôlé par l’API (un agent sans droit sur les membres voit un refus explicite).

## Modules

| Module | Routes | Backend propriétaire | Statut |
|---|---|---|---|
| Administration | `/admin`, `/admin/role`, `/admin/member` | [Administration](../../../../api/src/Administration/doc/README.md) | Création des rôles ([détail](roles.md)) ; liste et ajout des membres ([détail](membres.md)) |
| Demandes citoyennes | à créer | [Citizen](../../../../api/src/Citizen/doc/README.md) | Cible (F22, D17) |
| Pilotage | `/pilotage` | [Pilotage](../../../../api/src/Pilotage/doc/README.md) | Flux Nova Terra livré ([détail](pilotage.md)) |
| Contenus (`content`) | `/contenus`, `/contenus/alertes`, `/contenus/services` (entrée « Contenus de la ville » de la barre latérale d’Administration) | [Communication](../../../../api/src/Communication/doc/README.md), [Administration](../../../../api/src/Administration/doc/README.md) | Publications, alertes, services et transports livrés ([détail](contenus.md)) |

## Organisation cible

L’admin regroupe toutes les opérations de la mairie. Un module par domaine, chacun branché sur le BC propriétaire :

| Module | Backend | Contenu | Lots |
|---|---|---|---|
| `admin` | Administration | Membres, rôles | L1 |
| `requests` | Citizen | File des demandes, compteur d’attente, traitement | L2 |
| `content` | Administration (services), Communication (publications, alertes — [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)) | Services (état, horaires), publications, alertes | L3, L7, L9 |
| `pilotage` | Pilotage | Flux de l’API Webcup | L6 |

## Limites

La déconnexion est locale ; la révocation commune reste à concevoir. Les droits affichés ne remplacent pas les contrôles serveur.

[Installation et commandes](../README.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Site](../../site/doc/README.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
- [Citizen](../../../../api/src/Citizen/doc/README.md)
- [Pilotage](../../../../api/src/Pilotage/doc/README.md)
- [Communication](../../../../api/src/Communication/doc/README.md)
- [Contenus](contenus.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
