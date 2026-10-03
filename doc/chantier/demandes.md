# Registre des demandes Webcup

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › [Chantier](README.md) › Registre des demandes
<!-- navigation:end -->

Une ligne par `request_code`, dans l’ordre d’arrivée. Le texte complet de chaque besoin est dans le champ `message_public` de l’[API du concours](../contexte/README.md#lapi-du-concours-webcup) ; le résumé ci-dessous sert au pilotage.

Statuts : ⬜ à faire · 🟡 en cours · ⚠️ partiel · ✅ livré · ⏸️ écarté. Un statut ✅ suppose la fonctionnalité utilisable de bout en bout (API, interface, tests) et documentée chez son propriétaire.

## Demandes initiales (H+0)

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D01 | 1 | 250 | Un habitant crée simplement son compte et retrouve son espace | L1 | Citizen, IAM, site | ⚠️ API livrée ([`POST /api/citizen/register`, profil](../../api/src/Citizen/doc/README.md#livré)) ; page d’inscription et espace du site en cours |
| D03 | 1 | 250 | Se reconnecter à un espace personnel clairement identifié | L1 | IAM, site | ⚠️ connexion livrée, pas d’espace personnel |
| D04 | 1 | 250 | Envoyer un message aux services municipaux, avec confirmation | L2 | Citizen, site | ⬜ |
| D05 | 1 | 250 | Présenter clairement les principaux services municipaux | L3 | Administration, site | ⬜ |
| D06 | 1 | 250 | Consulter les publications de la ville | L3 | Administration, site | ⬜ |
| D07 | 2 | 500 | Page d’accueil qui hiérarchise l’essentiel et mène aux services | L3 | site | ⬜ accueil de remplacement |
| D08 | 2 | 500 | Distinguer citoyens, agents et administrateurs | L1 | Administration, Citizen | ⚠️ rôles et membres livrés, profil citoyen livré côté API (`GET /api/citizen/me`) |
| D09 | 2 | 500 | Limiter les outils sensibles aux profils autorisés | L1 | Administration | ⚠️ contrôles serveur livrés pour l’admin |
| D19 | 3 | 750 | Espace agents distinct qui affiche le flux de l’API Nova Terra | L6 | Pilotage, admin | ⚠️ espace distinct livré, flux absent |
| F22 | 1 | 250 | Les agents voient les demandes reçues, leur état et celles à traiter | L2 | Citizen, admin | ⬜ |

## Vague 1 (H+2) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| F21 | 2 | 520 | Utilisable avec un lecteur d’écran (boutons, formulaires, structure) | L4 | site, admin | ⬜ |
| F23 | 2 | 520 | Affichage plus contrasté et moins fatigant | L4 | site, admin | ⬜ |
| F24 | 1 | 260 | Agrandir le texte sans casser la mise en page | L4 | site, admin | ⬜ |

## Vague 2 (H+3) — « Premiers habitants »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D11 | 2 | 540 | Retrouver ses demandes, leur état et les étapes déjà réalisées | L2 | Citizen, site | ⬜ |
| D12 | 2 | 540 | Première connexion guidée : profil, trouver un service, lancer une démarche | L4 | site, Citizen | ⬜ |
| D14 | 2 | 540 | Choisir une autre langue pour l’interface | L5 | site | ⬜ |
| D15 | 1 | 270 | Repère de navigation (fil d’Ariane) et retour aux niveaux précédents | L4 | site, admin | ⬜ |
| D16 | 1 | 270 | Confirmation claire immédiatement après l’envoi d’une demande | L2 | Citizen, site | ⬜ |
| D17 | 1 | 270 | Nombre de demandes en attente de prise en charge, d’un coup d’œil | L2 | Citizen, admin | ⬜ |
| F25 | 2 | 540 | Signaler un problème sur la voie publique avec description et lieu | L2 | Citizen, site | ⬜ |
| F26 | 1 | 270 | Historique des demandes dans l’espace personnel | L2 | Citizen, site | ⬜ |
| F27 | 2 | 540 | Contenus des services et démarches proposés en plusieurs langues | L5 | Administration, site | ⬜ |
| F28 | 1 | 270 | Mettre en avant les services prioritaires ou les plus utilisés | L3 | Administration, site | ⬜ |

## Vague 3 (H+4) — « Informer et servir »

| Code | Diff. | XP | Besoin | Lot | Propriétaire | Statut |
|---|---|---|---|---|---|---|
| D18 | 3 | 840 | Diffuser rapidement un message général à tous les habitants, visible au bon moment | L7 | Administration, site | ⬜ |
| F29 | 3 | 840 | Alerter les habitants d’un quartier (montée des eaux, quartier sud) | L7 | Administration, Citizen, site | ⬜ |
| F30 | 2 | 560 | Prévenir les habitants lorsqu’une annonce importante est publiée | L7 | Administration, Citizen, site | ⬜ |
| F31 | 3 | 840 | Informer rapidement les personnes vulnérables avec des recommandations adaptées (vague de chaleur) — liée à l’IA | L7 | Administration, Citizen, site | ⬜ |
| F32 | 1 | 280 | Retrouver rapidement un service (ex. santé) : recherche et filtres | L3 | Administration, site | ⬜ |

## Vagues suivantes

Ajouter une section par vague au moment de sa diffusion, en suivant la [procédure](README.md#quand-une-vague-arrive).

<!-- backlinks:start -->
---

[← Retour à Chantier](README.md)

**Référencé depuis :**

- [Chantier](README.md)
<!-- backlinks:end -->
