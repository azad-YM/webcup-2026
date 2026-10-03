# Registre des demandes Webcup

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Chantier](README.md) › Registre des demandes
<!-- navigation:end -->

Une ligne par `request_code`, dans l’ordre d’arrivée. Le texte complet de chaque besoin est dans le champ `message_public` de l’[API du concours](../contexte/README.md#lapi-du-concours-webcup) ; le résumé ci-dessous sert au pilotage.

Statuts : ⬜ à faire · 🟡 en cours · ⚠️ partiel · ✅ livré · ⏸️ écarté. Un statut ✅ suppose la fonctionnalité utilisable de bout en bout (API, interface, tests) et documentée chez son propriétaire.

## Demandes initiales (H+0)

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D01 | 1 | 250 | Un habitant crée simplement son compte et retrouve son espace | L1 | Citizen, IAM, site | 🟡 API ([`POST /api/citizen/register`](../../api/src/Citizen/doc/README.md#livré)) et site ([inscription en 2 étapes, espace](../../front/apps/site/doc/parcours-citoyen.md)) livrés ; bout en bout à vérifier dans le navigateur |
| D03 | 1 | 250 | Se reconnecter à un espace personnel clairement identifié | L1 | IAM, site | 🟡 connexion et espace `/espace` livrés (API `GET /api/citizen/me` + site) ; bout en bout à vérifier dans le navigateur |
| D04 | 1 | 250 | Envoyer un message aux services municipaux, avec confirmation | L2 | Citizen, site | ⬜ |
| D05 | 1 | 250 | Présenter clairement les principaux services municipaux | L3 | Administration, site | ⚠️ catalogue et fiches de service sur le site, contenu local de démonstration (API au lot L3) |
| D06 | 1 | 250 | Consulter les publications de la ville | L3 | Communication, site | ⚠️ liste et lecture des actualités sur le site, contenu local de démonstration (API au lot L3) |
| D07 | 2 | 500 | Page d’accueil qui hiérarchise l’essentiel et mène aux services | L3 | site | ⚠️ accueil structuré (présentation, « Que souhaitez-vous faire ? », recherche, services, actualités, appel à créer un compte) ; contenu local tant que L3 n’est pas livré |
| D08 | 2 | 500 | Distinguer citoyens, agents et administrateurs | L1 | Administration, Citizen | 🟡 les trois profils existent : citoyen (API Citizen + espace du site), « Agent municipal » et « Administrateur principal » (rôles, liste et ajout des membres dans l’admin) ; à vérifier dans le navigateur |
| D09 | 2 | 500 | Limiter les outils sensibles aux profils autorisés | L1 | Administration | ✅ chaque outil de l’admin (rôles, membres, flux Nova Terra) exige sa permission côté serveur, testé ; refus 403 expliqué dans l’interface. À étendre aux outils des lots suivants |
| D19 | 3 | 750 | Espace agents distinct qui affiche le flux de l’API Nova Terra | L6 | Pilotage, admin | 🟡 page « Flux Nova Terra » (`/pilotage`) sur la route `GET /api/pilotage/webcup-feed`, testée avec l’API du concours simulée ; ✅ dès qu’elle est vérifiée avec la vraie clé dans `api/.env.local` |
| F22 | 1 | 250 | Les agents voient les demandes reçues, leur état et celles à traiter | L2 | Citizen, admin | ⬜ |

## Vague 1 (H+2) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F21 | 2 | 520 | Utilisable avec un lecteur d’écran (boutons, formulaires, structure) | L4 | site, admin | ⚠️ base site : landmarks, lien d’évitement, champs étiquetés, erreurs reliées, annonces `aria-live`, focus visible ; audit et admin à faire |
| F23 | 2 | 520 | Affichage plus contrasté et moins fatigant | L4 | site, admin | ⬜ |
| F24 | 1 | 260 | Agrandir le texte sans casser la mise en page | L4 | site, admin | ⬜ |

## Vague 2 (H+3) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D11 | 2 | 540 | Retrouver ses demandes, leur état et les étapes déjà réalisées | L2 | Citizen, site | ⬜ |
| D12 | 2 | 540 | Première connexion guidée : profil, trouver un service, lancer une démarche | L4 | site, Citizen | ⚠️ invitation à compléter le profil et raccourcis dans l’espace ; parcours guidé complet à faire |
| D14 | 2 | 540 | Choisir une autre langue pour l’interface | L5 | site | ⬜ |
| D15 | 1 | 270 | Repère de navigation (fil d’Ariane) et retour aux niveaux précédents | L4 | site, admin | ⚠️ site : fil d’Ariane sur toutes les pages hors accueil (premier niveau) ; admin à faire |
| D16 | 1 | 270 | Confirmation claire immédiatement après l’envoi d’une demande | L2 | Citizen, site | ⬜ |
| D17 | 1 | 270 | Nombre de demandes en attente de prise en charge, d’un coup d’œil | L2 | Citizen, admin | ⬜ |
| F25 | 2 | 540 | Signaler un problème sur la voie publique avec description et lieu | L2 | Citizen, site | ⬜ |
| F26 | 1 | 270 | Historique des demandes dans l’espace personnel | L2 | Citizen, site | ⬜ |
| F27 | 2 | 540 | Contenus des services et démarches proposés en plusieurs langues | L5 | Administration, site | ⬜ |
| F28 | 1 | 270 | Mettre en avant les services prioritaires ou les plus utilisés | L3 | Administration, site | ⚠️ « Services les plus demandés » sur l’accueil, mise en avant locale (API au lot L3) |

## Vague 3 (H+4) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D18 | 3 | 840 | Diffuser rapidement un message général à tous les habitants, visible au bon moment | L7 | Communication, site | ⬜ |
| F29 | 3 | 840 | Alerter les habitants d’un quartier (montée des eaux, quartier sud) | L7 | Communication, Citizen, site | ⬜ |
| F30 | 2 | 560 | Prévenir les habitants lorsqu’une annonce importante est publiée | L7 | Communication, Citizen, site | ⬜ |
| F31 | 3 | 840 | Informer rapidement les personnes vulnérables avec des recommandations adaptées (vague de chaleur) — liée à l’IA | L7 | Communication, Citizen, site | ⬜ |
| F32 | 1 | 280 | Retrouver rapidement un service (ex. santé) : recherche et filtres | L3 | Administration, site | ⚠️ recherche et filtre par thème sur `/services`, contenu local (API au lot L3) |

## Vague 4 (H+5) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F33 | 1 | 290 | Le citoyen peut supprimer son compte, sans qu’une personne non autorisée puisse le faire | L8 | Citizen, IAM, site | ⬜ |
| F34 | 2 | 580 | Les agents administrent les comptes citoyens (consulter, suspendre…), sans accès non autorisé | L8 | Citizen, Administration, admin | ⬜ |
| F35 | 1 | 290 | Indications contextuelles au bon moment pour les premières actions, sans long guide | L4 | site | ⬜ |
| F36 | 2 | 580 | Consulter les horaires et informations des transports municipaux, utiles à sa situation | L9 | Administration, site | ⬜ |

## Vague 5 (H+6) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F37 | 3 | 900 | Protéger les comptes contre les tentatives de connexion inhabituelles, de façon perceptible sans gêner l’usage normal | L8 | IAM, site | ⬜ |
| F38 | 2 | 600 | Savoir qu’un service est interrompu (maintenance, incident) avant de commencer une démarche, quand revenir ou quoi faire | L9 | Administration, site | ⬜ |
| F39 | 2 | 600 | Prendre rendez-vous avec un agent : créneau sans ambiguïté, informations pour préparer le rendez-vous | L10 | Citizen, admin, site | ⬜ |
| F40 | 1 | 300 | Recevoir un rappel avant son rendez-vous | L10 | Citizen, Communication, site | ⬜ |

## Vagues suivantes

Ajouter une section par vague au moment de sa diffusion, en suivant la [procédure](README.md#quand-une-vague-arrive).

<!-- backlinks:start -->
---

[← Retour à Chantier](README.md)

**Référencé depuis :**

- [Chantier](README.md)
<!-- backlinks:end -->
