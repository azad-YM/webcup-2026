# Citizen — suppression et administration des comptes citoyens (L8)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Compte et sécurité
<!-- navigation:end -->

Lot L8, demandes F33 (le citoyen supprime son compte) et F34 (les agents administrent les comptes citoyens). Statut : 🟡 code livré, non vérifié dans un navigateur, aucun test exécuté.

## Mission

Permettre à un habitant de quitter la plateforme sans qu’une autre personne puisse le faire à sa place, et permettre aux agents habilités de consulter et de suspendre des comptes citoyens, sans jamais voir de mot de passe. La connexion elle-même (statut du compte, sessions, verrouillage) reste à [IAM](../../IAM/doc/comptes-et-sessions.md).

## Consommateurs

- [Site — espace personnel](../../../../front/apps/site/doc/parcours-citoyen.md) : suppression du compte depuis « Mon profil ».
- [Admin — comptes citoyens](../../../../front/apps/admin/doc/comptes-citoyens.md) : liste, recherche, consultation, suspension et réactivation.

## Livré

| Cas d’usage | Route | Code |
|---|---|---|
| `DeleteMyCitizenAccount` | `DELETE /api/citizen/me` `{password}` | `Application/Command/DeleteMyCitizenAccount` |
| `ListCitizenAccounts` | `GET /api/citizen/accounts?q=&status=` | `Application/Query/ListCitizenAccounts` |
| `SetCitizenSuspension` | `PUT /api/citizen/accounts/suspension` `{citizenId, suspended}` | `Application/Command/SetCitizenSuspension` |

### Suppression du compte (F33)

- Identité : toujours le compte connecté (JWT) ; un `userId` envoyé dans le payload est ignoré. Sans JWT → 401.
- Reconfirmation : le mot de passe actuel est vérifié par IAM (`CitizenAccountManager::verifyPassword`). Incorrect → 403, rien n’est modifié. Le site exige en plus une case « Je comprends que cette suppression est définitive ».
- **Décision : anonymisation plutôt que suppression physique.** Le citoyen passe au statut `deleted` et tous ses champs personnels (nom, prénom, téléphone, adresse, quartier, langue) sont effacés ; la ligne et son `id` restent pour que les demandes et l’historique de traitement de la mairie (lot L2) gardent leurs références, sans identité. Côté IAM, l’e-mail est remplacé, le nom effacé, le mot de passe rendu inutilisable et le statut `deleted` est définitif ; l’adresse e-mail redevient libre pour une nouvelle inscription. Un compte supprimé n’apparaît plus dans la liste des agents et ne peut pas être réactivé (409).
- Données rattachées : le port `Application/Ports/Service/AccountDataEraser` (tag `citizen.account_data_eraser`, autoconfiguré) permet au lot L2 d’effacer ou d’anonymiser ses propres données dans la même transaction. Effaceurs branchés : notifications, rendez-vous (créneaux libérés), inquiétudes et soutiens (repositories Doctrine de Citizen) ; les demandes restent, détachées de l’identité.
- Transaction : IAM (`ChangeAccountStatus` via `IAMCitizenAccountManager`), effaceurs et citoyen sont écrits dans la transaction du `command.bus` ; un échec annule tout.
- Session : la version de session IAM est incrémentée, donc tous les JWT du compte (site et admin) sont refusés (401) dès la requête suivante ; le site vide sa session et affiche « Votre compte a été supprimé » sur la page de connexion.
- **Règle compte citoyen + agent** : si le compte est aussi membre **actif** de l’administration (port `CitizenAccountAccessPolicy::isProtectedAccount`, implémenté par Administration), la suppression est refusée (409, « Ce compte est aussi un compte d’agent actif. Contactez un administrateur… »). L’agent ne perd donc jamais silencieusement son accès : un administrateur doit d’abord désactiver ou retirer le membre, puis le citoyen peut supprimer son compte. La vérification du mot de passe a lieu avant ce contrôle, pour ne rien révéler à une session volée.

### Administration des comptes citoyens (F34)

- Autorisation : port `Application/Ports/Provider/CitizenAccountAccessPolicy`, implémenté par Administration (`Administration/Infrastructure/Adapter/Citizen/AdminCitizenAccountAccessPolicy`) avec les permissions `admin.citizen.read` (liste et consultation) et `admin.citizen.write` (suspension, réactivation ; implique la lecture). Sinon 403. Un citoyen ordinaire reçoit 403.
- Liste : comptes `active` et `suspended`, plus récents d’abord ; recherche `q` (insensible à la casse) sur e-mail, nom, prénom, téléphone et quartier ; filtre `status` ; 200 éléments au plus, `total` donne le nombre de correspondances. Chaque élément : `profile` (vue `CitizenProfile`), `email` (fourni par IAM par lot, `CitizenAccountManager::emails`), `status`, `canSuspend`. Réponse : `{items, total, canManage}`. Aucun mot de passe ni empreinte n’est jamais exposé.
- Suspension / réactivation : refusée pour un compte supprimé (409) ou partagé avec un membre actif de l’administration (409, `canSuspend: false`). La suspension invalide immédiatement toutes les sessions et codes de portail du compte ; à la connexion, le citoyen suspendu reçoit (après un mot de passe correct) « Votre compte est suspendu par la mairie… » (403 `account_suspended`). Après réactivation, il se reconnecte normalement.
- Persistance : colonne `citizens.status` (`active`, `suspended`, `deleted`), migration `Version20261003008000`.

## Ports

| Besoin de Citizen | Port (Citizen) | Adaptateur (fournisseur) |
|---|---|---|
| Reconfirmer le mot de passe, lire les e-mails, suspendre, supprimer le compte | `Application/Ports/Provider/CitizenAccountManager` | `IAM/Infrastructure/Adapter/Citizen/IAMCitizenAccountManager` |
| Autoriser l’agent et protéger un compte agent | `Application/Ports/Provider/CitizenAccountAccessPolicy` | `Administration/Infrastructure/Adapter/Citizen/AdminCitizenAccountAccessPolicy` |
| Effacer les données citoyennes d’autres SD | `Application/Ports/Service/AccountDataEraser` | à brancher par L2 |

## Questions ouvertes

- Motif de suspension (affiché au citoyen et tracé) et historique des actions des agents : non conservés aujourd’hui.
- Pagination au-delà de 200 comptes (la recherche filtre aujourd’hui en mémoire après lecture des comptes non supprimés).
- Faut-il proposer à un agent de retirer seulement son profil citoyen tout en gardant son compte ?

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [Admin — comptes citoyens](../../../../front/apps/admin/doc/comptes-citoyens.md)
- [Administration — membres et habilitations](../../Administration/doc/membres-et-habilitations.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
<!-- backlinks:end -->
