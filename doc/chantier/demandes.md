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
| D04 | 1 | 250 | Envoyer un message aux services municipaux, avec confirmation | L2 | Citizen, site | 🟡 « Contacter la mairie » ([site](../../front/apps/site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2)) sur `POST /api/citizen/requests` ([Citizen](../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2)) ; ni testé ni vérifié dans le navigateur |
| D05 | 1 | 250 | Présenter clairement les principaux services municipaux | L3 | Administration, site | 🟡 catalogue et fiches servis par l’API d’Administration, gestion dans l’admin ; non vérifié dans un navigateur, sans test |
| D06 | 1 | 250 | Consulter les publications de la ville | L3 | Communication, site | 🟡 actualités servies par l’API de Communication, publication par les agents dans l’admin ; non vérifié dans un navigateur, sans test |
| D07 | 2 | 500 | Page d’accueil qui hiérarchise l’essentiel et mène aux services | L3 | site | 🟡 accueil structuré branché sur l’API (services mis en avant, dernières actualités) ; non vérifié dans un navigateur |
| D08 | 2 | 500 | Distinguer citoyens, agents et administrateurs | L1 | Administration, Citizen | 🟡 les trois profils existent : citoyen (API Citizen + espace du site), « Agent municipal » et « Administrateur principal » (rôles, liste et ajout des membres dans l’admin) ; à vérifier dans le navigateur |
| D09 | 2 | 500 | Limiter les outils sensibles aux profils autorisés | L1 | Administration | ✅ chaque outil de l’admin (rôles, membres, flux Nova Terra) exige sa permission côté serveur, testé ; refus 403 expliqué dans l’interface. À étendre aux outils des lots suivants |
| D19 | 3 | 750 | Espace agents distinct qui affiche le flux de l’API Nova Terra | L6 | Pilotage, admin | 🟡 page « Flux Nova Terra » (`/pilotage`) sur la route `GET /api/pilotage/webcup-feed`, testée avec l’API du concours simulée ; ✅ dès qu’elle est vérifiée avec la vraie clé dans `api/.env.local` |
| F22 | 1 | 250 | Les agents voient les demandes reçues, leur état et celles à traiter | L2 | Citizen, admin | 🟡 module « Demandes citoyennes » de l’admin ([file des agents](../../front/apps/admin/doc/demandes.md)), filtre par état, traitement avec commentaire, temps réel ; ni testé ni vérifié dans le navigateur |

## Vague 1 (H+2) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F21 | 2 | 520 | Utilisable avec un lecteur d’écran (boutons, formulaires, structure) | L4 | site, admin | 🟡 repères, champs et erreurs reliés, annonces, focus après navigation (site et admin) — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié dans un navigateur |
| F23 | 2 | 520 | Affichage plus contrasté et moins fatigant | L4 | site, admin | 🟡 palette AA, mode contraste élevé (panneau « Affichage ») — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| F24 | 1 | 260 | Agrandir le texte sans casser la mise en page | L4 | site, admin | 🟡 taille du texte 100/125/150 % en rem, sans flash — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |

## Vague 2 (H+3) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D11 | 2 | 540 | Retrouver ses demandes, leur état et les étapes déjà réalisées | L2 | Citizen, site | 🟡 « Mes demandes » : état et chronologie des étapes horodatées (`/espace/demandes?ref=…`) ; ni testé ni vérifié dans le navigateur |
| D12 | 2 | 540 | Première connexion guidée : profil, trouver un service, lancer une démarche | L4 | site, Citizen | 🟡 guide de première visite en 3 étapes sur `/espace`, masquable et mémorisé — [site](../../front/apps/site/doc/accessibilite.md) ; non vérifié |
| D14 | 2 | 540 | Choisir une autre langue pour l’interface | L5 | site | ⬜ |
| D15 | 1 | 270 | Repère de navigation (fil d’Ariane) et retour aux niveaux précédents | L4 | site, admin | 🟡 site : toutes les pages hors accueil ; admin : fil calculé depuis l’adresse — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| D16 | 1 | 270 | Confirmation claire immédiatement après l’envoi d’une demande | L2 | Citizen, site | 🟡 écran de confirmation avec la référence `NT-AAAA-NNNN` juste après l’envoi ; ni testé ni vérifié dans le navigateur |
| D17 | 1 | 270 | Nombre de demandes en attente de prise en charge, d’un coup d’œil | L2 | Citizen, admin | 🟡 badge « N en attente » (`pendingCount`) dans la file de l’admin, mis à jour en temps réel ; ni testé ni vérifié dans le navigateur |
| F25 | 2 | 540 | Signaler un problème sur la voie publique avec description et lieu | L2 | Citizen, site | 🟡 « Signaler un problème » avec description et lieu obligatoire ; ni testé ni vérifié dans le navigateur |
| F26 | 1 | 270 | Historique des demandes dans l’espace personnel | L2 | Citizen, site | 🟡 historique des demandes dans `/espace/demandes` ; ni testé ni vérifié dans le navigateur |
| F27 | 2 | 540 | Contenus des services et démarches proposés en plusieurs langues | L5 | Administration, site | ⬜ |
| F28 | 1 | 270 | Mettre en avant les services prioritaires ou les plus utilisés | L3 | Administration, site | 🟡 « Services les plus demandés » selon la mise en avant gérée par les agents ; non vérifié dans un navigateur |

## Vague 3 (H+4) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D18 | 3 | 840 | Diffuser rapidement un message général à tous les habitants, visible au bon moment | L7 | Communication, site | 🟡 alertes (gravité, validité) créées dans l’admin, bandeau du site mis à jour en temps réel ; non vérifié dans un navigateur, sans test |
| F29 | 3 | 840 | Alerter les habitants d’un quartier (montée des eaux, quartier sud) | L7 | Communication, Citizen, site | 🟡 alerte ciblée par quartier (liste fermée), visible des citoyens du quartier (bandeau, notifications, temps réel) ; non vérifié dans un navigateur |
| F30 | 2 | 560 | Prévenir les habitants lorsqu’une annonce importante est publiée | L7 | Communication, Citizen, site | 🟡 annonce importante signalée dans les notifications de l’espace citoyen, en temps réel ; non vérifié dans un navigateur |
| F31 | 3 | 840 | Informer rapidement les personnes vulnérables avec des recommandations adaptées (vague de chaleur) — liée à l’IA | L7 | Communication, Citizen, site | 🟡 alertes sanitaires avec recommandations rédigées à la main, réservées aux citoyens qui ont consenti ; non vérifié dans un navigateur |
| F32 | 1 | 280 | Retrouver rapidement un service (ex. santé) : recherche et filtres | L3 | Administration, site | 🟡 recherche et filtre par thème sur `/services` (et `?q=`, `?category=` côté API) ; non vérifié dans un navigateur |

## Vague 4 (H+5) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F33 | 1 | 290 | Le citoyen peut supprimer son compte, sans qu’une personne non autorisée puisse le faire | L8 | Citizen, IAM, site | 🟡 livré ([règles](../../api/src/Citizen/doc/compte-et-securite.md)), non vérifié dans un navigateur |
| F34 | 2 | 580 | Les agents administrent les comptes citoyens (consulter, suspendre…), sans accès non autorisé | L8 | Citizen, Administration, admin | 🟡 livré ([page](../../front/apps/admin/doc/comptes-citoyens.md)), non vérifié dans un navigateur |
| F35 | 1 | 290 | Indications contextuelles au bon moment pour les premières actions, sans long guide | L4 | site | 🟡 astuces refermables (services, nouvelle demande), vues une fois — [site](../../front/apps/site/doc/accessibilite.md) ; non vérifié |
| F36 | 2 | 580 | Consulter les horaires et informations des transports municipaux, utiles à sa situation | L9 | Administration, site | 🟡 horaires et informations des transports sur la fiche des services de mobilité, saisis dans l’admin ; non vérifié dans un navigateur |

## Vague 5 (H+6) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F37 | 3 | 900 | Protéger les comptes contre les tentatives de connexion inhabituelles, de façon perceptible sans gêner l’usage normal | L8 | IAM, site, admin | 🟡 livré ([règles](../../api/src/IAM/doc/comptes-et-sessions.md#protection-contre-les-tentatives-de-connexion-f37), [journal](../../front/apps/admin/doc/securite.md)), non vérifié dans un navigateur |
| F38 | 2 | 600 | Savoir qu’un service est interrompu (maintenance, incident) avant de commencer une démarche, quand revenir ou quoi faire | L9 | Administration, site | 🟡 état du service (disponible, maintenance, incident), message, retour prévu et alternative sur la carte et la fiche ; non vérifié dans un navigateur |
| F39 | 2 | 600 | Prendre rendez-vous avec un agent : créneau sans ambiguïté, informations pour préparer le rendez-vous | L10 | Citizen, admin, site | ⬜ |
| F40 | 1 | 300 | Recevoir un rappel avant son rendez-vous | L10 | Citizen, Communication, site | ⬜ |

## Vague 6 (H+7) — « Inclusion et structuration »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D13 | 1 | 310 | Remplacer les mots difficiles par un langage clair, sans jargon technique | L4 | site, admin | 🟡 libellés simplifiés, erreurs techniques traduites, glossaire `/aide/glossaire` — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| D20 | 3 | 930 | Plateforme utilisable par les personnes en situation de handicap, sans parcours à part | L4 | site, admin | 🟡 réglages intégrés aux mêmes pages, pas de parcours à part — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| F41 | 2 | 620 | Toutes les actions atteignables au clavier seul | L4 | site, admin | 🟡 focus toujours visible, liens d’évitement site et admin, dialogues piégés avec Échap, retour du focus — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| F42 | 3 | 930 | Formulaires, composants, champs et erreurs réellement accessibles aux technologies d’assistance | L4 | site, admin | 🟡 `label`, `aria-describedby`, `aria-invalid`, erreurs annoncées et reliées (site et admin) — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| F43 | 1 | 310 | Ne pas dépendre de la couleur seule pour distinguer l’information | L4 | site, admin | 🟡 `StatusBadge` icône + libellé + bordure, liens soulignés — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| F44 | 2 | 620 | Agrandir le contenu (zoom) sans casser l’affichage | L4 | site, admin | 🟡 mise en page fluide à 200 % / 320 px, en-tête non collant au besoin — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |

## Vague 7 (H+8) — « Inclusion et structuration »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F45 | 3 | 960 | Localiser les services physiques de la ville (carte, adresse, itinéraire) | L11 | Administration, site | ⬜ |
| F46 | 1 | 320 | Trouver rapidement hôpitaux et services d’urgence | L11 | Administration, site | ⬜ |
| F47 | 3 | 960 | Justifier les actions réalisées : opérations consultables et traçables dans le temps, faciles à retrouver par les agents | L12 | Audit, admin | 🟡 journal des actions (BC Audit, `GET /api/audit/entries`, écran `/admin/journal`, filtres acteur/action/période/recherche) ; non testé, non vérifié dans un navigateur |
| F48 | 2 | 640 | Savoir qui a modifié quoi dans l’administration | L12 | Audit, admin | 🟡 acteur, date, cible et détail de chaque action de l’administration ([journal](../../front/apps/admin/doc/journal-des-actions.md)) ; non testé |

## Vague 8 (H+9) — « Inclusion et structuration »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F49 | 1 | 330 | Être informé quand sa demande change d’état | L2 | Citizen, site | ⬜ |
| F50 | 3 | 990 | Tableau de bord simplifié de l’activité de la plateforme pour les agents | L13 | Pilotage, admin | 🟡 `/pilotage/tableau-de-bord` sur `GET /api/pilotage/activity` (chiffres des BC propriétaires par ports, relecture 60 s) ; non testé, non vérifié dans un navigateur |
| F51 | 3 | 990 | Comprendre l’usage de ses données et faire remonter ses inquiétudes, avec trace de prise en compte | L14 | Citizen, site, admin | ⬜ |
| F52 | 2 | 660 | Soutenir une demande déjà déposée par d’autres habitants | L14 | Citizen, site | ⬜ |

## Vagues suivantes

Ajouter une section par vague au moment de sa diffusion, en suivant la [procédure](README.md#quand-une-vague-arrive).

<!-- backlinks:start -->
---

[← Retour à Chantier](README.md)

**Référencé depuis :**

- [Chantier](README.md)
<!-- backlinks:end -->
