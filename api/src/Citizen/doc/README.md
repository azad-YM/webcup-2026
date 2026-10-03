# Documentation — Citizen

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Citizen
<!-- navigation:end -->

Citizen est le BC de la **relation entre les habitants et la ville de Nova Terra**. Un habitant y devient citoyen, renseigne son profil, s’adresse à la mairie, signale un problème et suit le traitement de ses demandes. Côté administration, c’est la file de travail des agents.

> **État : cible retenue, aucun code livré.** Le suivi est dans le [chantier](../../../../doc/chantier/README.md).

## Utilisateurs

- **Visiteur** : crée son compte depuis le [site](../../../../front/apps/site/doc/README.md) et devient aussitôt citoyen.
- **Citoyen** : se connecte par e-mail et mot de passe, complète son profil quand il le souhaite, envoie des demandes et suit leur avancement.
- **Agent municipal** : consulte les demandes reçues, voit celles qui attendent une prise en charge et fait avancer leur statut depuis l’[admin](../../../../front/apps/admin/doc/README.md).

## Responsabilités

- Inscription d’un citoyen et profil personnel.
- Demandes citoyennes : message à la mairie et signalement localisé.
- Cycle de vie d’une demande et historique de ses étapes.
- Indicateurs de charge pour les agents.

Hors périmètre : comptes, mots de passe et connexion ([IAM](../../IAM/doc/README.md)) ; rôles et droits des agents, services municipaux et publications ([Administration](../../Administration/doc/README.md)).

## Décisions retenues

- **Être citoyen** : toute personne qui crée un compte depuis le site devient citoyen immédiatement. Il n’existe pas de statut « vérifié » ni de validation par un agent.
- **Connexion** : par e-mail et mot de passe, via la connexion IAM existante (`POST /api/login_check`). Pas de code à usage unique par e-mail.
- **Inscription en deux étapes** :
  1. e-mail et mot de passe (obligatoires) : création du compte IAM et du citoyen, puis connexion ;
  2. informations personnelles (facultatives) : l’étape peut être passée, et le citoyen peut les renseigner plus tard depuis son espace personnel.
- **E-mail déjà utilisé** : l’inscription est refusée avec une invitation à se connecter.

## Modèle cible

**Citoyen** (`Citizen`) :

| Champ | Obligatoire | Usage |
|---|---|---|
| `id`, `userId` | oui | Lien avec le compte IAM |
| `registeredAt` | oui | Date d’inscription |
| `firstName`, `lastName` | non | Personnalisation de l’espace, traitement des demandes |
| `phone` | non | Recontact par les services |
| `address` | non | Pré-remplissage des signalements |
| `district` (quartier) | non | Alertes ciblées par quartier (F29) |
| `preferredLanguage` | non | Langue de l’interface (D14) |

Le profil est « complété » quand les champs facultatifs utiles sont renseignés ; ce n’est qu’un indicateur pour guider le citoyen (D12), jamais une condition d’accès.

**Demande** (`ServiceRequest`) :

| Champ | Rôle | Demandes Webcup |
|---|---|---|
| `reference` (ex. `NT-2026-0042`) | Confirmation lisible après l’envoi | D16 |
| `type` : `contact` \| `report` | Message à la mairie ou signalement sur l’espace public | D04, F25 |
| `serviceId` (optionnel) | Service municipal concerné, par identifiant | D05 |
| `subject`, `description` | Contenu de la demande | D04, F25 |
| `location` (texte libre, optionnel) | Lieu du signalement | F25 |
| `citizenId` | Auteur | D11, F26 |
| `status` : `submitted` → `acknowledged` → `in_progress` → `resolved` \| `rejected` | État courant | F22, D17 |
| `steps[]` : `{status, at, comment}` | Historique visible par le citoyen | D11 |
| `createdAt` | Tri et historique | F26 |

## Parcours cibles

- **Inscription** (D01) : le site appelle une route publique de Citizen avec e-mail et mot de passe. Citizen demande le compte à IAM puis crée le citoyen dans la même transaction. Le site connecte ensuite le citoyen et propose l’étape « Mes informations », que l’utilisateur peut passer.
- **Espace personnel** (D03, D12) : accueil du citoyen, invitation à compléter le profil, accès aux services et aux demandes.
- **Envoi d’une demande** : formulaire, puis écran de confirmation qui affiche la référence (D04, D16, F25).
- **Mes demandes** : liste, statut et chronologie des étapes (D11, F26).
- **File des agents** : liste filtrable par statut, compteur « en attente », changement de statut avec commentaire (F22, D17).

## Ports prévus

| Besoin de Citizen | Fournisseur |
|---|---|
| Créer le compte d’un nouveau citoyen | IAM (`Adapter/Citizen`) |
| Connaître le compte connecté | IAM (`Adapter/Citizen`) |
| Vérifier qu’un agent peut lire ou traiter les demandes | Administration (`Adapter/Citizen`) |

## Questions ouvertes

- Liste des quartiers de Nova Terra : liste fermée gérée par Administration, ou saisie libre ?
- Alertes aux personnes vulnérables (F31) : faut-il un champ facultatif « je souhaite recevoir les alertes sanitaires » ? Il faudrait un consentement explicite, sans donnée de santé détaillée.
- Transitions de statut autorisées et motif obligatoire en cas de rejet.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Administration](../../Administration/doc/README.md)
- [IAM](../../IAM/doc/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
<!-- backlinks:end -->
