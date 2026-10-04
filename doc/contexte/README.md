# Contexte produit — Nova Terra

<!-- navigation:start -->
[Accueil du projet](../../README.md) › [Documentation](../README.md) › Contexte produit
<!-- navigation:end -->

## Le produit

Nova Terra est la première ville fondée par l’humanité sur une autre planète. La plateforme est son **cœur numérique** : elle permet aux habitants d’accéder aux services de la ville, de s’informer, de contacter la mairie, de signaler un problème et de suivre leurs démarches ; elle donne aux agents municipaux un espace de travail pour traiter ces demandes.

Le projet est réalisé pendant les **24H By Webcup 2026**. Les besoins de la ville arrivent progressivement par l’API du concours (voir plus bas) ; chaque besoin retenu devient une fonctionnalité intégrée à la plateforme.

## Utilisateurs

| Profil | Application | Ce qu’il fait | Propriétaire backend |
|---|---|---|---|
| Visiteur | site | Découvre la ville, ses services et ses actualités, voit les alertes, consulte les projets, les résultats des consultations et les idées ; s’inscrit | Administration (services), Communication (publications, alertes), Participation (projets, consultations, idées), Citizen (inscription) |
| Citoyen | site | Se connecte, complète son profil, reçoit les alertes qui le concernent, envoie des demandes, suit leur traitement, répond aux consultations, propose des idées | Citizen, Communication, Participation |
| Agent municipal | admin | Traite les demandes, publie des informations et des alertes, publie les projets et les consultations, suit les idées, tient le catalogue des services, suit le flux du concours | Citizen, Communication, Participation, Administration, Pilotage |
| Administrateur | admin | Gère les membres et leurs rôles | Administration |

Un même compte ([IAM](../../api/src/IAM/doc/README.md)) peut porter plusieurs profils : un agent peut aussi être citoyen.

## Carte des modules

```text
IAM ─────────────── comptes, connexion, passage site → admin
 ▲         ▲
 │ port    │ port (création de compte, compte connecté)
 │         │
Administration ──── membres, rôles, permissions ; services municipaux, quartiers
 ▲
 │ port (droits des agents)
 │
Citizen ─────────── citoyens (inscription, profil, préférences d’alerte livrés), demandes, suivi (cible)

Communication ───── publications, alertes, audiences (livré, ADR 005)
   │ port (droit de publier, quartiers) → Administration
   └ port (quartier, consentement du citoyen) → Citizen

Participation ───── projets, consultations et avis, contributions, idées (livré, ADR 008)
   │ port (droits des agents, quartiers) → Administration
   │ port (citoyen connecté, notifications) → Citizen
   └ adaptateur d’effacement à la suppression du compte ← Citizen

Pilotage ────────── flux de l’API du concours pour les agents
   │ port (droit admin.pilotage.read) → Administration
   └ port (lecture de l’API Webcup, cache 20 s) → API du concours
```

Communication est décidé par l’[ADR 005](../technique/decisions/005-bc-communication.md) ; ses mises à jour sans rechargement passent par le port temps réel de l’[ADR 004](../technique/decisions/004-temps-reel.md).
Participation est décidé par l’[ADR 008](../technique/decisions/008-bc-participation.md).

- [IAM](../../api/src/IAM/doc/README.md) · [Administration](../../api/src/Administration/doc/README.md) · [Citizen](../../api/src/Citizen/doc/README.md) · [Communication](../../api/src/Communication/doc/README.md) · [Participation](../../api/src/Participation/doc/README.md) · [Pilotage](../../api/src/Pilotage/doc/README.md)
- Applications : [site](../../front/apps/site/doc/README.md) (portail citoyen) · [admin](../../front/apps/admin/doc/README.md) (espace des agents)
- Décision de découpage : [ADR 003](../technique/decisions/003-identite-et-habilitations.md)

## L’API du concours Webcup

C’est le **flux des besoins de la ville**, au fil des 24 heures. Il ne s’agit pas de données de la plateforme : chaque demande décrit une fonctionnalité à interpréter et à construire. La demande D19 exige toutefois que les agents puissent consulter ce flux depuis leur espace : c’est le BC [Pilotage](../../api/src/Pilotage/doc/README.md) (route `GET /api/pilotage/webcup-feed`) et la page « Flux Nova Terra » de l’[admin](../../front/apps/admin/doc/pilotage.md).

- **Endpoint** : `GET https://24h.webcup.fr/wp-json/webcup/v1/requests`
- **Authentification** : en-tête `X-Webcup-Api-Key` (ou `?api_key=`). Clé absente ou invalide → `403`. La clé reste côté serveur (`api/.env.local`), jamais dans le JavaScript du navigateur ni dans le dépôt.
- **Réponse** :
  - `session` : `status`, `is_running`, `current_wave`, `elapsed_minutes`, `visible_requests_count`, `next_wave_number`, `minutes_until_next_wave` (`0` quand il n’y a plus de vague) ;
  - `requests` : uniquement les demandes déjà diffusées ; inutile de filtrer soi-même.
- **Une demande** : `request_code` (identifiant stable à utiliser), `requester_name`, `requester_type`, `message_public` (le besoin à interpréter), `difficulty` / `difficulty_level` (1 Facile, 2 Moyenne, 3 Difficile, 4 Expert), `xp_base`, `xp_time_bonus`, `xp_total`, `xp_available`, `is_initial`, `wave_number`, `arrival_time`, `group_name`.
- **XP** : `xp_total = xp_base + xp_time_bonus`. Le bonus est **fixe** : il ne diminue pas pendant le développement.
- **`arrival_time`** est un délai depuis le début du concours (`02:00:00` = H+2), pas une heure de la journée.
- **Fonctionnement** : pas de push ; interroger toutes les 15 à 30 secondes. Ne supposer ni un nombre fixe de demandes, ni un intervalle régulier entre les vagues.

<!-- backlinks:start -->
---

[← Retour à Documentation](../README.md)

**Référencé depuis :**

- [Documentation](../README.md)
- [Accueil du projet](../../README.md)
- [Chantier](../chantier/README.md)
- [Registre des demandes](../chantier/demandes.md)
- [Communication](../../api/src/Communication/doc/README.md)
- [Participation](../../api/src/Participation/doc/README.md)
- [ADR 008](../technique/decisions/008-bc-participation.md)
<!-- backlinks:end -->
