# Chantier

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › Chantier
<!-- navigation:end -->

Suivi des travaux de la plateforme pendant les 24H By Webcup : ce qui est livré, ce qui est en cours et ce qui reste à faire. Les règles métier ne sont pas décrites ici. Elles restent dans le `doc` de leur BC ou de leur application, et ce dossier n’y renvoie que par des liens.

- [Registre des demandes Webcup](demandes.md) : une ligne par demande, avec son lot, son propriétaire et son statut.
- [Contexte produit et API du concours](../contexte/README.md)

## État du flux

Relevé du 2026-10-03 à H+4h41 : vague 3 diffusée, 28 demandes visibles (10 initiales, 18 issues des vagues) pour 12 460 XP. La vague 4 est annoncée 19 minutes plus tard.

## Lots

Les lots regroupent les demandes qui partagent un même modèle ou un même écran. L’ordre de travail retenu est L1, L2, L3, L7, L4, L5, L6. L7 vient après L3 parce que les alertes s’appuient sur les publications et sur le quartier du citoyen ; L6 est court (environ 1 h) et peut être intercalé dès qu’un créneau se libère.

| Lot | Contenu | Demandes | XP | Statut |
|---|---|---|---|---|
| L0 | Séparer l’identité (IAM) des membres et rôles (Administration), retirer le gabarit Example, cadrer Citizen — [ADR 003](../technique/decisions/003-identite-et-habilitations.md) | — | — | ✅ |
| L1 | Comptes et profils : inscription citoyenne, espace personnel, rôles Agent et Administrateur, formulaire de membre | D01, D03, D08, D09 | 1 500 | ⬜ |
| L2 | Demandes citoyennes : envoi, confirmation, signalement, suivi, file des agents, compteur d’attente | D04, D16, F25, D11, F26, F22, D17 | 2 390 | ⬜ |
| L3 | Services municipaux (avec recherche et filtres), publications, page d’accueil | D05, D06, F28, F32, D07 | 1 550 | ⬜ |
| L7 | Alertes et diffusion : message général, alerte ciblée par quartier, avis d’annonce importante, recommandations aux personnes vulnérables | D18, F29, F30, F31 | 3 080 | ⬜ |
| L4 | Accessibilité et repères : lecteur d’écran, contraste, taille du texte, fil d’Ariane, première connexion | F21, F23, F24, D15, D12 | 2 110 | ⬜ |
| L5 | Multilingue : interface, puis contenus | D14, F27 | 1 080 | ⬜ |
| L6 | Pilotage : flux de l’API Webcup dans l’espace des agents | D19 | 750 | ⬜ |

## Prochaines tâches

### L1 — Comptes et profils

Décisions : [Citizen — décisions retenues](../../api/src/Citizen/doc/README.md#décisions-retenues).

1. Créer le BC `Citizen` sur le modèle d’`Administration` : autoload, services, routes, mapping, suite PHPUnit, migration, avec l’entité `Citizen`.
2. Cas d’usage `RegisterCitizen` `{email, password}` : route publique dans le firewall, création du compte via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis création du citoyen dans la même transaction. Un e-mail déjà utilisé est refusé. Retirer `/api/auth/register`.
3. Cas d’usage `GetMyCitizenProfile` et `UpdateMyCitizenProfile` (champs facultatifs : prénom, nom, téléphone, adresse, quartier, langue).
4. Site : inscription en deux étapes (compte, puis « Mes informations » que l’on peut passer), connexion automatique, espace personnel `/espace` avec le nom du citoyen, l’invitation à compléter le profil et des raccourcis.
5. Administration : rôles de référence Agent et Administrateur à l’initialisation, et formulaire « Ajouter un membre » dans l’admin.

### L7 — Alertes et diffusion (à cadrer)

- Une **alerte** est une publication urgente avec un niveau de gravité, une période de validité et une audience : tous les habitants, un quartier, ou les personnes ayant demandé les alertes sanitaires.
- Elle s’affiche en bandeau sur le site pendant sa validité (D18, F29) et apparaît dans les notifications de l’espace personnel des citoyens concernés (F30).
- F31 est marquée « liée à l’IA » : un agent pourrait générer des recommandations adaptées à chaque audience avec un modèle Claude, puis les relire avant publication.
- Questions : quartiers en liste fermée ? notifications seulement dans l’application, ou aussi par e-mail ? consentement pour les alertes sanitaires.

### Socle produit

- Remplacer l’habillage « Boilerplate » du site et de l’admin par l’identité de Nova Terra.
- Ajouter `WEBCUP_API_KEY` à `api/.env.example`, sans valeur, et définir la vraie clé dans `api/.env.local` pour le lot L6.

## Quand une vague arrive

1. Interroger l’API (Insomnia, ou la page Pilotage une fois le lot L6 livré) et relever l’état de `session`.
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
<!-- backlinks:end -->
