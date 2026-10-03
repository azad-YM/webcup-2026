# Chantier

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › Chantier
<!-- navigation:end -->

Suivi des travaux de la plateforme pendant les 24H By Webcup : ce qui est livré, ce qui est en cours et ce qui reste à faire. Les règles métier ne sont pas décrites ici. Elles restent dans le `doc` de leur BC ou de leur application, et ce dossier n’y renvoie que par des liens.

- [Registre des demandes Webcup](demandes.md) : une ligne par demande, avec son lot, son propriétaire et son statut.
- [Contexte produit et API du concours](../contexte/README.md)

## État du flux

Relevé du 2026-10-03 : vagues 4 (H+5) et 5 (H+6) diffusées, 36 demandes visibles pour 16 600 XP.

## Lots

Les lots regroupent les demandes qui partagent un même modèle ou un même écran. L’ordre de travail retenu est L1, L2, L3, L7, L4, L5, L6. L7 vient après L3 parce que les alertes s’appuient sur les publications et sur le quartier du citoyen ; L6 est court (environ 1 h) et peut être intercalé dès qu’un créneau se libère.

| Lot | Contenu | Demandes | XP | Statut |
|---|---|---|---|---|
| L0 | Séparer l’identité (IAM) des membres et rôles (Administration), retirer le gabarit Example, cadrer Citizen — [ADR 003](../technique/decisions/003-identite-et-habilitations.md) | — | — | ✅ |
| L1 | Comptes et profils : inscription citoyenne, espace personnel, rôles Agent et Administrateur, formulaire de membre | D01, D03, D08, D09 | 1 500 | 🟡 tâches 1 à 5 livrées ; parcours à vérifier dans le navigateur |
| L2 | Demandes citoyennes : envoi, confirmation, signalement, suivi, file des agents, compteur d’attente | D04, D16, F25, D11, F26, F22, D17 | 2 390 | ⬜ |
| L3 | Services municipaux (avec recherche et filtres), publications, page d’accueil | D05, D06, F28, F32, D07 | 1 550 | ⬜ |
| L7 | Alertes et diffusion : message général, alerte ciblée par quartier, avis d’annonce importante, recommandations aux personnes vulnérables | D18, F29, F30, F31 | 3 080 | ⬜ |
| L4 | Accessibilité et repères : lecteur d’écran, contraste, taille du texte, fil d’Ariane, première connexion, indications contextuelles | F21, F23, F24, D15, D12, F35 | 2 400 | ⬜ |
| L5 | Multilingue : interface, puis contenus | D14, F27 | 1 080 | ⬜ |
| L6 | Pilotage : flux de l’API Webcup dans l’espace des agents — [Pilotage](../../api/src/Pilotage/doc/README.md), [page](../../front/apps/admin/doc/pilotage.md) | D19 | 750 | 🟡 livré, à vérifier avec la vraie clé |
| L8 | Compte et sécurité : suppression de son compte, administration des comptes citoyens par les agents, protection contre les tentatives de connexion | F33, F34, F37 | 1 770 | ⬜ |
| L9 | Services pratiques : transports (horaires et infos), service interrompu ou en maintenance | F36, F38 | 1 180 | ⬜ |
| L10 | Rendez-vous avec un agent et rappel | F39, F40 | 900 | ⬜ |

## Travail en parallèle

Des agents travaillent en même temps dans des worktrees git séparés, chacun sur sa branche et dans sa zone de fichiers. Les contrats partagés sont fixés avant le lancement. L’intégration (fusion, résolution des conflits de configuration, vérification) est faite sur `socle/nova-terra`.

| Agent | Périmètre | Zone de fichiers | Contrat |
|---|---|---|---|
| A — Citizen API | L1 tâches 1 à 3 | `api/src/Citizen`, `api/src/IAM/Infrastructure/Adapter/Citizen`, config API | [Contrat HTTP Citizen](../../api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1) |
| B — Site | L1 tâche 4, socle du site, structure de la vitrine | `front/apps/site` | Même contrat, consommé côté site |
| C — Admin et Pilotage | L1 tâche 5, puis L6 | `api/src/Administration`, `api/src/Pilotage`, `front/apps/admin`, config API | Routes Pilotage à documenter dans son BC |

## Prochaines tâches

### L1 — Comptes et profils

Décisions : [Citizen — décisions retenues](../../api/src/Citizen/doc/README.md#décisions-retenues).

1. ✅ Créer le BC `Citizen` sur le modèle d’`Administration` : autoload, services, routes, mapping, suite PHPUnit, migration, avec l’entité `Citizen`.
2. ✅ Cas d’usage `RegisterCitizen` `{email, password}` : route publique dans le firewall, création du compte via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis création du citoyen dans la même transaction. Un e-mail déjà utilisé est refusé (`409`). `/api/auth/register` retirée.
3. ✅ Cas d’usage `GetMyCitizenProfile` et `UpdateMyCitizenProfile` (champs facultatifs : prénom, nom, téléphone, adresse, quartier, langue).

   Détail et écarts éventuels : [Citizen — livré](../../api/src/Citizen/doc/README.md#livré).
4. ✅ Site : inscription en deux étapes (compte, puis « Mes informations » que l’on peut passer), connexion automatique, espace personnel `/espace` avec le nom du citoyen, l’invitation à compléter le profil et des raccourcis. Voir le [parcours citoyen](../../front/apps/site/doc/parcours-citoyen.md) ; parcours de bout en bout à vérifier dans le navigateur.
5. ✅ Administration : rôles de référence « Agent municipal » et « Administrateur principal » à l’initialisation, liste des rôles et des membres, formulaire « Ajouter un membre » dans l’admin ([membres](../../front/apps/admin/doc/membres.md)).

### L7 — Alertes et diffusion (à cadrer)

Décisions : BC propriétaire `Communication` ([ADR 005](../technique/decisions/005-bc-communication.md)) ; diffusion sans rechargement par le port `RealtimePublisher`, Mercure par défaut et fournisseur choisi par `REALTIME_TRANSPORT` ([ADR 004](../technique/decisions/004-temps-reel.md)). Livré : le port, les adaptateurs Mercure, Pusher et « aucun », le hub Mercure de développement ; à faire : abonnement côté front et topics privés ; le BC Communication reste à créer.

- Une **alerte** est une publication urgente avec un niveau de gravité, une période de validité et une audience : tous les habitants, un quartier, ou les personnes ayant demandé les alertes sanitaires.
- Elle s’affiche en bandeau sur le site pendant sa validité (D18, F29) et apparaît dans les notifications de l’espace personnel des citoyens concernés (F30).
- F31 est marquée « liée à l’IA » : un agent pourrait générer des recommandations adaptées à chaque audience avec un modèle Claude, puis les relire avant publication.
- Décidé : quartiers en **liste fermée** (Nord, Sud, Est, Ouest, Centre, Port) gérée par Administration ; recommandations F31 **rédigées à la main** par les agents (pas de génération par IA pour l’instant).
- Questions : notifications par e-mail en plus de l’application ? consentement pour les alertes sanitaires.

### Socle produit

- Remplacer l’habillage « Boilerplate » par l’identité de Nova Terra. Site : fait (en-tête, navigation, pied de page, fil d’Ariane, base d’accessibilité) ; admin : à faire.
- Vitrine du site : structure livrée (accueil, services avec recherche et filtre, actualités) sur un adaptateur **local** de démonstration ; brancher l’HTTP d’Administration au lot L3 ([site](../../front/apps/site/doc/README.md#limites-et-questions-ouvertes)).
- ✅ `WEBCUP_API_URL` et `WEBCUP_API_KEY` déclarés dans `api/.env.example` (clé vide). Reste à définir la vraie clé dans `api/.env.local` et à vérifier la page sur la vraie API.

## Quand une vague arrive

1. Consulter la page « Flux Nova Terra » de l’admin (`/pilotage`, les nouvelles demandes y sont surlignées) ou interroger l’API, et relever l’état de `session`.
2. Ajouter les nouvelles demandes au [registre](demandes.md), avec un résumé du besoin, l’XP et la difficulté.
3. Rattacher chaque demande à un lot existant ou en créer un. Choisir son BC propriétaire en suivant la [carte des modules](../contexte/README.md#carte-des-modules).
4. Réordonner les lots selon le rapport XP / effort et selon ce qui débloque d’autres demandes.
5. Mettre à jour la ligne « État du flux » ci-dessus.

## Règles de suivi

- Un statut passe à ✅ seulement quand le parcours est utilisable de bout en bout, testé et documenté chez son propriétaire.
- Une décision qui touche plusieurs BC fait l’objet d’un ADR. Les autres décisions vont dans le `doc` du BC concerné.

<!-- backlinks:start -->
---

[← Retour à Documentation](../README.md)

**Référencé depuis :**

- [Documentation](../README.md)
- [Accueil du projet](../../README.md)
- [Contexte produit](../contexte/README.md)
- [Administration](../../api/src/Administration/doc/README.md)
- [Citizen](../../api/src/Citizen/doc/README.md)
- [Site](../../front/apps/site/doc/README.md)
<!-- backlinks:end -->
