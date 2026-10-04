# Registre des demandes Webcup

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Chantier](README.md) › Registre des demandes
<!-- navigation:end -->

Une ligne par `request_code`, dans l’ordre d’arrivée. Le texte complet de chaque besoin est dans le champ `message_public` de l’[API du concours](../contexte/README.md#lapi-du-concours-webcup) ; le résumé ci-dessous sert au pilotage.

Statuts : ⬜ à faire · 🟡 en cours · ⚠️ partiel · ✅ livré · ⏸️ écarté. Un statut ✅ suppose la fonctionnalité utilisable de bout en bout (API, interface, tests) et documentée chez son propriétaire.

## Revue du 2026-10-03

Les 71 demandes ont été rapprochées du code et des documents des propriétaires. Les fonctionnalités implémentées mais non validées restent 🟡 ; les couvertures incomplètes restent ⚠️. Cette revue ne remplace pas une recette navigateur ni un audit d’accessibilité, de sécurité ou de performance.

Le Pilotage local contient déjà 15 statuts `done` saisis par « Administrateur principal » : D01, D03, D04, D05, D06, D07, D08, D09, D12, D15, D16, D17, D18, D19, D20. Ils sont conservés lors de la synchronisation ; les réserves de validation du présent registre restent applicables. Les autres suivis sont complétés depuis ce registre (🟡/⚠️ → `in_progress`, ✅ → `done`, ⬜ → `todo`).

### Validation navigateur confirmée par l’utilisateur

Après cette revue, l’utilisateur confirme les parcours navigateur et demande leur passage en « fait » dans le Pilotage local. 31 suivis supplémentaires sont validés : D11, D13, F21, F22, F23, F24, F25, F26, F28, F29, F30, F31, F32, F33, F34, F35, F36, F37, F38, F39, F41, F42, F43, F44, F47, F48, F49, F50, F51, F52, F64. F48 appartient au même parcours de journal que F47. Les notes antérieures sont conservées comme historique. Les réserves navigateur ci-dessous sont donc levées pour ces demandes ; les mentions d’absence de tests automatisés restent une dette technique, pas un blocage du statut demandé.

Les 15 suivis déjà faits sont conservés. F40 reste en cours (cron et réception des rappels à vérifier), F63 et F72 restent partiels. Les 22 demandes à construire restent à faire. Aucun nouveau test navigateur ou automatisé n’a été exécuté par l’agent : la validation provient de l’utilisateur.

### Seconde validation utilisateur — 2026-10-04

À la demande de l’utilisateur, les demandes livrées dont la seule réserve était la vérification dans le navigateur passent en « fait » dans le snapshot Pilotage (43 suivis) : D02, D10, F45, F46, F53, F54, F55, F56, F57, F58, F59, F60, F61, F62, F63, F65, F66, F67, F68, F69, F70, F71, F72, F73, F74, F75, F76, F77, F78, F79, F80, F81, F82, F83, F84, F85, F86, F87, F88, F89, F90, F91, F92. F73, F74, F76 et F88 (lot L26) sont inclus après leur intégration. Les mentions « non testé » des tableaux restent une dette technique.

Restent en cours : F40 (planification du cron et réception des rappels), D14 et F27 (traduction partielle : publications et alertes non traduites). Bilan : **89 faits, 3 en cours** sur les 92 premières demandes ; les 8 demandes des vagues 19 et 20 (F93 à F100) sont à faire.

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
| D14 | 2 | 540 | Choisir une autre langue pour l’interface | L5 | site | 🟡 sélecteur français / anglais / arabe (RTL) dans l’en-tête, choix mémorisé, `lang`/`dir` à jour ; couverture partielle documentée — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
| D15 | 1 | 270 | Repère de navigation (fil d’Ariane) et retour aux niveaux précédents | L4 | site, admin | 🟡 site : toutes les pages hors accueil ; admin : fil calculé depuis l’adresse — [site](../../front/apps/site/doc/accessibilite.md), [admin](../../front/apps/admin/doc/accessibilite.md) ; non vérifié |
| D16 | 1 | 270 | Confirmation claire immédiatement après l’envoi d’une demande | L2 | Citizen, site | 🟡 écran de confirmation avec la référence `NT-AAAA-NNNN` juste après l’envoi ; ni testé ni vérifié dans le navigateur |
| D17 | 1 | 270 | Nombre de demandes en attente de prise en charge, d’un coup d’œil | L2 | Citizen, admin | 🟡 badge « N en attente » (`pendingCount`) dans la file de l’admin, mis à jour en temps réel ; ni testé ni vérifié dans le navigateur |
| F25 | 2 | 540 | Signaler un problème sur la voie publique avec description et lieu | L2 | Citizen, site | 🟡 « Signaler un problème » avec description et lieu obligatoire ; ni testé ni vérifié dans le navigateur |
| F26 | 1 | 270 | Historique des demandes dans l’espace personnel | L2 | Citizen, site | 🟡 historique des demandes dans `/espace/demandes` ; ni testé ni vérifié dans le navigateur |
| F27 | 2 | 540 | Contenus des services et démarches proposés en plusieurs langues | L5 | Administration, site | 🟡 traductions anglais/arabe des services saisies dans l’admin, affichées avec repli et « Non traduit » ; publications et alertes non traduites — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
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
| F39 | 2 | 600 | Prendre rendez-vous avec un agent : créneau sans ambiguïté, informations pour préparer le rendez-vous | L10 | Citizen, admin, site | 🟡 créneaux ouverts par les agents, réservation, déplacement et annulation dans `/espace/rendez-vous` ; confirmation avec lieu, consignes et fuseau ; ni testé ni vérifié dans le navigateur |
| F40 | 1 | 300 | Recevoir un rappel avant son rendez-vous | L10 | Citizen, Communication, site | 🟡 rappels persistés et temps réel (veille et 2 h avant), commande `app:appointments:remind` ; planification du cron et réception à vérifier ; non testé |

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
| F45 | 3 | 960 | Localiser les services physiques de la ville (carte, adresse, itinéraire) | L11 | Administration, site | 🟡 `/carte` (Leaflet/OSM chargé à la demande, liste filtrable, près de moi), itinéraire OSM, mini-localisation sur la fiche — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
| F46 | 1 | 320 | Trouver rapidement hôpitaux et services d’urgence | L11 | Administration, site | 🟡 `/urgences` (15, 17, 18, 112, 114 cliquables ; hôpital, urgences, pharmacie, police, pompiers) en un clic depuis l’en-tête et l’accueil — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
| F47 | 3 | 960 | Justifier les actions réalisées : opérations consultables et traçables dans le temps, faciles à retrouver par les agents | L12 | Audit, admin | 🟡 journal des actions (BC Audit, `GET /api/audit/entries`, écran `/admin/journal`, filtres acteur/action/période/recherche) ; non testé, non vérifié dans un navigateur |
| F48 | 2 | 640 | Savoir qui a modifié quoi dans l’administration | L12 | Audit, admin | 🟡 acteur, date, cible et détail de chaque action de l’administration ([journal](../../front/apps/admin/doc/journal-des-actions.md)) ; non testé |

## Vague 8 (H+9) — « Inclusion et structuration »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F49 | 1 | 330 | Être informé quand sa demande change d’état | L2 | Citizen, site | 🟡 centre « Mes notifications » de `/espace`, bandeau et pastille, temps réel `notification.created` ([Citizen](../../api/src/Citizen/doc/notifications.md)) ; ni testé ni vérifié dans le navigateur |
| F50 | 3 | 990 | Tableau de bord simplifié de l’activité de la plateforme pour les agents | L13 | Pilotage, admin | 🟡 `/pilotage/tableau-de-bord` sur `GET /api/pilotage/activity` (chiffres des BC propriétaires par ports, relecture 60 s) ; non testé, non vérifié dans un navigateur |
| F51 | 3 | 990 | Comprendre l’usage de ses données et faire remonter ses inquiétudes, avec trace de prise en compte | L14 | Citizen, site, admin | 🟡 page `/vos-donnees`, inquiétudes avec accusé `INQ-…` et suivi ([participation](../../api/src/Citizen/doc/participation.md)) ; ni testé ni vérifié dans le navigateur |
| F52 | 2 | 660 | Soutenir une demande déjà déposée par d’autres habitants | L14 | Citizen, site | 🟡 signalements publics et soutien unique par habitant ([participation](../../api/src/Citizen/doc/participation.md)) ; ni testé ni vérifié dans le navigateur |

## Vague 9 (H+10) — « Confiance et maîtrise des données »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D02 | 3 | 1 020 | Se connecter sans mot de passe classique, avec un haut niveau de sécurité et un parcours compréhensible | L15 | IAM, site | 🟡 lien e-mail à usage unique lié au navigateur ([IAM](../../api/src/IAM/doc/connexion-renforcee.md)) — non testé, non vérifié dans un navigateur |
| F53 | 3 | 1 020 | Vérification supplémentaire pour sécuriser les comptes citoyens | L15 | IAM, site | 🟡 code à 6 chiffres par e-mail, appareil de confiance 30 jours ([IAM](../../api/src/IAM/doc/connexion-renforcee.md)) — non testé, non vérifié dans un navigateur |
| F54 | 2 | 680 | Être prévenu d’une connexion à son compte depuis un nouvel appareil | L15 | IAM, Citizen, site | 🟡 appareils reconnus, e-mail + notification, « Ce n’était pas moi » ([IAM](../../api/src/IAM/doc/connexion-renforcee.md)) — non testé, non vérifié dans un navigateur |
| F55 | 3 | 1 020 | Récupérer les informations personnelles que la ville possède sur soi, sous une forme claire et exploitable | L16 | Citizen, site | 🟡 « Mes données » : rubriques expliquées + JSON, confirmation d’identité ([Citizen](../../api/src/Citizen/doc/mes-donnees.md)) — non testé, non vérifié dans un navigateur |
| F56 | 2 | 680 | Télécharger un récapitulatif lisible de ses demandes | L16 | Citizen, site | 🟡 récapitulatif imprimable + CSV ([Citizen](../../api/src/Citizen/doc/mes-donnees.md)) — non testé, non vérifié dans un navigateur |

## Vague 10 (H+11) — « Confiance et maîtrise des données »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F57 | 2 | 700 | Évaluer la performance environnementale du site et l’alléger | L17 | site, admin | 🟡 script `scripts/ecoindex.mjs` (poids, requêtes, DOM, EcoIndex), tableau avant/après, page `/sobriete` — [sobriété](../../front/apps/site/doc/sobriete.md#diagnostic-f57) ; non testé, non vérifié dans un navigateur |
| F58 | 3 | 1 050 | Appliquer des choix de conception et de chargement sobres sur les principaux parcours | L17 | site, admin | 🟡 fenêtres, menu du compte, cloche et espaces à la demande, imports sans baril, police système, pas de rafraîchissement onglet caché ; admin en pages `React.lazy` + `manualChunks` — [sobriété](../../front/apps/site/doc/sobriete.md#conception-et-chargement-sobres-appareils-peu-puissants-f58-f61) ; non testé, non vérifié dans un navigateur |
| F59 | 2 | 700 | Rester utilisable avec une connexion très lente | L17 | site | 🟡 service worker `public/sw.js` (pages essentielles et données publiques, délai, nouvelle tentative), bandeau « connexion lente » / « Hors ligne — informations du JJ/MM à HHhMM », brouillons de formulaire — [sobriété](../../front/apps/site/doc/sobriete.md#connexion-très-lente-ou-coupée-f59) ; non testé, non vérifié dans un navigateur |
| F60 | 1 | 350 | Images et médias qui n’alourdissent pas inutilement les pages | L17 | site, Communication | 🟡 aucune image matricielle (SVG seulement), règles documentées, pas de téléversement Communication (question ouverte) — [sobriété](../../front/apps/site/doc/sobriete.md#images-et-médias-f60) ; non testé, non vérifié dans un navigateur |

## Vague 11 (H+12) — « Confiance et maîtrise des données »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F61 | 3 | 1 080 | Rester rapide sur des appareils peu puissants | L17 | site, admin | 🟡 moins de JS au premier chargement, pied de page en `content-visibility`, animations coupées, un seul flux temps réel, rafraîchissements suspendus onglet caché — [sobriété](../../front/apps/site/doc/sobriete.md#conception-et-chargement-sobres-appareils-peu-puissants-f58-f61) ; non testé, non vérifié dans un navigateur |
| F62 | 2 | 720 | Version plus simple et plus rapide de certaines pages | L17 | site | 🟡 « Mode léger » dans « Affichage », proposé si économie de données ou réseau lent, activé pour la visite en mode dégradé serveur (503) : sans décor ni animation, liste au lieu de la carte, sans temps réel — [sobriété](../../front/apps/site/doc/sobriete.md#mode-léger-f62) ; non testé, non vérifié dans un navigateur |
| F63 | 3 | 1 080 | Les administrateurs désactivent rapidement un service défectueux | L18 | Administration, Citizen, admin | 🟡 bouton « Désactiver le service » avec motif obligatoire et réactivation ([admin](../../front/apps/admin/doc/contenus.md)) ; refus `409 service_disabled` des demandes et rendez-vous ([Citizen](../../api/src/Citizen/doc/rendez-vous.md)), temps réel, journal ([Administration](../../api/src/Administration/doc/README.md)) ; non testé, non vérifié dans un navigateur |
| F64 | 1 | 360 | Voir l’état actuel d’un service avant de commencer une démarche | L18 | Administration, site | 🟡 bandeau d’état (`StatusBadge`) en tête de fiche, du formulaire de demande et des rendez-vous, avec alternative, retour prévu et contact ([site](../../front/apps/site/doc/vitrine-et-alertes.md)) ; non testé, non vérifié dans un navigateur |

## Vague 12 (H+13) — « Participation et nouveaux usages »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F65 | 3 | 1 110 | Soumettre certaines décisions à l’avis des habitants, avec trace de la contribution | L19 | Participation, site, admin | 🟡 consultations (choix + commentaire), accusé de réception, « Mes contributions », résultats à la clôture, « Ce que la ville en a retenu » — [BC](../../api/src/Participation/doc/README.md) ; non testé, non vérifié dans un navigateur |
| F66 | 2 | 740 | Donner son avis sur un projet sans vote officiel, et savoir qu’il est enregistré | L19 | Participation, site | 🟡 avis non officiel (appréciation et/ou texte) avec accusé de réception — [site](../../front/apps/site/doc/participation.md) ; non testé, non vérifié dans un navigateur |
| F67 | 2 | 740 | Consulter les projets en cours dans la ville | L19 | Participation, site, admin | 🟡 `/projets` filtrable, détail avec étapes, gestion dans l’admin — [admin](../../front/apps/admin/doc/participation.md) ; non testé, non vérifié dans un navigateur |
| F68 | 1 | 370 | Proposer des idées pour améliorer la colonie | L19 | Participation, site, admin | 🟡 boîte à idées, statuts suivis, non-publication motivée, notification de l’auteur ; non testé, non vérifié dans un navigateur |

## Vague 13 (H+14) — « Participation et nouveaux usages »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F69 | 4 | 1 520 | Protéger les données sensibles contre l’exploitation d’une faille, de façon perceptible sans compliquer l’usage | L20 | tous les BC, IAM | 🟡 en-têtes de sécurité, CSP des deux fronts, limitation de débit (`429` expliqué), chiffrement au repos du téléphone et de l’adresse, erreurs `500` sans détail, page « Sécurité de vos données », annonce d’expiration de session admin ([ADR 007](../technique/decisions/007-protection-des-donnees.md)) ; non testé, non vérifié dans un navigateur |
| F70 | 3 | 1 140 | Réserver strictement certaines données administratives aux agents autorisés | L20 | Administration, admin | 🟡 données sensibles masquées par l’API (« Masqué — accès réservé »), affichage explicite journalisé pour `admin.sensitive-data.read`, inventaire des routes d’agent ([Administration](../../api/src/Administration/doc/README.md#inventaire-des-routes-dagent-f70)) ; non testé, non vérifié dans un navigateur |
| F71 | 3 | 1 140 | Accueillir des habitants sans adresse e-mail et ne parlant pas tous la même langue | L21 | IAM, Citizen, site, admin | 🟡 compte créé à l’accueil (`/demandes/accueil`, `POST /api/citizen/accounts/welcome`), identifiant `NT-XXXX-XXXX` et code provisoire sur fiche imprimable fr/en/ar, connexion sans e-mail, code personnel obligatoire — [ADR 010](../technique/decisions/010-comptes-crees-a-l-accueil.md), [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |
| F72 | 1 | 380 | Nouvel arrivant : savoir par où commencer sans refaire l’inscription | L21 | site, Citizen | 🟡 `/bienvenue` : 3 questions sans inscription, check-list et services priorisés ; connecté, invitation à compléter le profil ; liens depuis l’accueil, l’espace et la fiche d’accueil — [site](../../front/apps/site/doc/urgences-carte-langues.md) ; non testé, non vérifié dans un navigateur |

## Vague 14 (H+15) — « Participation et nouveaux usages »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F73 | 2 | 780 | Publier un message officiel du Haut Conseil, visible par tous immédiatement | L26 | Communication, site, admin | 🟡 alerte `official` signée, confirmation, bandeau en tête de toutes les pages (SSE + `polling`), « J’ai lu », `/messages-officiels` ([Communication](../../api/src/Communication/doc/README.md)) ; non testé, non vérifié dans un navigateur |
| F74 | 1 | 390 | Voir facilement les horaires et l’adresse des associations partenaires | L26 | Administration, site | 🟡 catégorie `partenaires`, horaires structurés, `/partenaires` (fr/en/ar), carte, 3 associations de démonstration ([Administration](../../api/src/Administration/doc/README.md)) ; non testé, non vérifié dans un navigateur |
| F75 (IA) | 3 | 1 170 | Aider les agents à repérer les demandes similaires qui parlent du même problème | L23 | Citizen, admin | 🟡 L23 — panneau « Même problème ? », repli local (similarité de texte) et IA facultative, liaison et traitement groupé — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |
| F76 | 2 | 780 | Laisser un commentaire après avoir utilisé un service, avec trace de prise en compte | L26 | Participation, site, admin | 🟡 `/espace/avis`, un avis par service et par mois, « Lu / Réponse du service », moyenne sur la fiche, page admin « Avis sur les services » ([Participation](../../api/src/Participation/doc/README.md)) ; non testé, non vérifié dans un navigateur |

## Vague 15 (H+16) — « Montée en charge et incidents »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F77 | 3 | 1 200 | Rester utilisable pendant une surcharge des serveurs, sans perdre l’essentiel | L24 | API, site, admin | 🟡 mode allégé (env, `app:platform:degraded`, détection auto), `503` + `Retry-After` sur le non essentiel, bandeau du site, état dans l’admin — [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md) ; non testé, non vérifié dans un navigateur |
| F78 | 4 | 1 600 | Rester stable quand beaucoup d’habitants se connectent en même temps | L24 | API, site | 🟡 cache public `ETag`/`304`, index, plafond et gigue SSE, `scripts/load/charge.sh`, [réglages](../technique/montee-en-charge.md) ; non testé, non vérifié dans un navigateur |
| F79 | 1 | 400 | Trier et filtrer par sujet les demandes et signalements consultés | L23 | Citizen, site | 🟡 L23 — filtres et tri par l’adresse dans « Mes demandes » et les signalements publics — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |
| F80 | 2 | 800 | Identifier et classer les dossiers prioritaires dans l’espace des agents | L23 | Citizen, admin | 🟡 L23 — priorité automatique modifiable, file triée, filtre, compteur des urgents — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |

## Vague 16 (H+17) — « Montée en charge et incidents »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F81 | 3 | 1 230 | Protéger les formulaires contre les envois automatiques de robots, sans gêner l’usage normal | L25 | Shared, site | 🟡 jeton HMAC horodaté, champ piège, question en langage clair en cas de doute, refus comptés — [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md) ; non testé, non vérifié dans un navigateur |
| F82 | 2 | 820 | Empêcher l’envoi multiple d’un même formulaire | L25 | Shared, Citizen, site | 🟡 `Idempotency-Key` (réponse rejouée), `useProtectedSubmit` sur le site et l’admin — [ADR 012](../technique/decisions/012-montee-en-charge-integrite-anti-abus.md) ; non testé, non vérifié dans un navigateur |
| F83 | 1 | 410 | Accusé de réception avec une référence identifiable, à conserver comme preuve | L23 | Citizen, site | 🟡 L23 — accusé imprimable et téléchargeable, e-mail, vérification publique — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |
| F84 | 2 | 820 | Les agents répondent directement à certaines demandes depuis leur interface | L23 | Citizen, admin, site | 🟡 L23 — fil de messages agent ↔ habitant, réponses types, notification et temps réel — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |

## Vague 17 (H+18) — « Montée en charge et incidents »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F85 (IA) | 4 | 1 680 | Détecter une activité inhabituelle et des informations incohérentes, protection perceptible | L25 | Audit, IAM, Shared, admin | 🟡 `app:security:scan`, écran « Activité inhabituelle », alerte en direct, protection automatique du compte, résumé IA avec repli — [Audit](../../api/src/Audit/doc/README.md) ; non testé, non vérifié dans un navigateur |
| F86 | 4 | 1 680 | Signalement d’une urgence médicale : traitement distinct d’une demande ordinaire, repérable immédiatement | L23 | Citizen, site, admin | 🟡 L23 — 15/112 immédiat sur le site, priorité urgente, alerte temps réel, bandeau et prise en charge horodatée — [Citizen](../../api/src/Citizen/doc/demandes-a-grande-echelle.md) ; non testé, non vérifié dans un navigateur |
| F87 | 3 | 1 260 | Vérifier que les données importantes peuvent être sauvegardées et restaurées, avec un rapport clair | L24 | API, admin | 🟡 `app:backup:run` / `app:backup:verify` (restauration d’essai, verdict), écran « Sauvegardes » (`admin.backup.read`), [procédure](../technique/montee-en-charge.md#sauvegarde-et-restauration-f87) ; non testé, non vérifié dans un navigateur |
| F88 | 2 | 840 | Sélectionner des données de suivi et les exporter dans un format simple à réutiliser | L26 | Pilotage, Citizen, admin | 🟡 `/pilotage/exports` : 5 jeux, période, statut, colonnes (sensibles masquées), aperçu, CSV/JSON, modèles locaux, journal (`admin.export.read`, [Pilotage](../../api/src/Pilotage/doc/README.md)) ; non testé, non vérifié dans un navigateur |

## Vague 18 (H+19) — « Assistance et résilience »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D10 (IA) | 3 | 1 290 | Trouver le bon service même avec une demande mal formulée — recherche tolérante (fautes, accents, pluriels, mots du quotidien) sur `/services`, « Vous vouliez dire… », reformulation par l’IA si disponible, issues mairie / urgences / bienvenue ([Assistance](../../api/src/Assistance/doc/README.md)) ; non testé, non vérifié dans un navigateur | L22 | Assistance, site | 🟡 |
| F89 | 2 | 860 | Version en langage clair des informations essentielles, sans perte de sens — champ « En clair » des services et publications, « Proposer une version en clair » dans l’admin (IA ou brouillon local, validé à l’enregistrement), interrupteur sur le site ; non testé, non vérifié dans un navigateur | L22 | Administration, site | 🟡 |
| F90 (IA) | 1 | 430 | Demander une explication plus simple d’un passage, uniquement au besoin — bouton « Expliquer simplement » (fiches services, actualités), repli : version en clair et mots difficiles (lexique + glossaire) ; non testé, non vérifié dans un navigateur | L22 | Assistance, site | 🟡 |
| F91 (IA) | 4 | 1 720 | Assistance automatisée qui oriente les habitants vers une réponse ou un service pertinent — assistant `/aide/assistant` et bouton flottant, 1 à 3 actions, services validés contre le catalogue, urgences 15/17/18/112 par règles, repli local sans clé, limite par IP ; non testé, non vérifié dans un navigateur | L22 | Assistance, site | 🟡 |
| F92 (IA) | 2 | 860 | Décrire son besoin simplement et être orienté vers le bon service ou la bonne démarche — description libre, questions de précision, demande préremplie `/espace/demandes/nouvelle?service=…` (voir F91) ; non testé, non vérifié dans un navigateur | L22 | Assistance, site | 🟡 |

## Vague 19 (H+20) — relevée le 2026-10-04

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F93 | 4 | 1 760 | Panne de réseau : fonctions essentielles et informations nécessaires compréhensibles et récupérables | L27 | API, site | ⬜ (prolonge F59, F77) |
| F94 | 2 | 880 | Pendant un incident, consulter au moins les informations essentielles, consignes et coordonnées utiles | L27 | site | ⬜ (prolonge F59, F62) |
| F95 | 3 | 1 320 | Réduire les ressources chargées et les requêtes inutiles relevées par les mesures | L27 | site, admin | ⬜ (prolonge F57, F58) |
| F96 | 2 | 880 | Sur mobile et connexion limitée, accéder vite à l’essentiel avec une présentation adaptée | L27 | site | ⬜ (prolonge F61, F62) |

## Vague 20 (H+21) — relevée le 2026-10-04

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F97 (IA) | 3 | 1 350 | Lignes de transport interrompues : trouver rapidement une solution de remplacement | L27 | Administration, Assistance, site | ⬜ (prolonge F36, F38) |
| F98 | 3 | 1 350 | Savoir quels services sont les plus utilisés, sous une forme claire et exploitable | L27 | Pilotage, admin | ⬜ (prolonge F50) |
| F99 | 3 | 1 350 | Services proposés par des partenaires extérieurs : disponibilité et prochaine action visibles | L27 | Administration, site | ⬜ (prolonge F74) |
| F100 | 2 | 900 | Les agents consultent facilement les derniers événements de sécurité | L27 | Audit, IAM, admin | ⬜ (prolonge F37, F85) |

## Vagues suivantes

Ajouter une section par vague au moment de sa diffusion, en suivant la [procédure](README.md#quand-une-vague-arrive).

<!-- backlinks:start -->
---

[← Retour à Chantier](README.md)

**Référencé depuis :**

- [Chantier](README.md)
<!-- backlinks:end -->
