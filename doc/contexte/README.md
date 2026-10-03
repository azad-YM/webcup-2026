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
| Visiteur | site | Découvre la ville, ses services et ses actualités ; s’inscrit | Administration (contenus), Citizen (inscription) |
| Citoyen | site | Se connecte, complète son profil, envoie des demandes, suit leur traitement | Citizen |
| Agent municipal | admin | Traite les demandes, publie des informations | Citizen, Administration |
| Administrateur | admin | Gère les membres et leurs rôles | Administration |

Un même compte ([IAM](../../api/src/IAM/doc/README.md)) peut porter plusieurs profils : un agent peut aussi être citoyen.

## Carte des modules

```text
IAM ─────────────── comptes, connexion, passage site → admin
 ▲         ▲
 │ port    │ port (création de compte, compte connecté)
 │         │
Administration ──── membres, rôles, permissions ; services, publications, alertes (cible)
 ▲
 │ port (droits des agents)
 │
Citizen ─────────── citoyens (inscription, profil livrés), demandes, suivi (cible)
```

- [IAM](../../api/src/IAM/doc/README.md) · [Administration](../../api/src/Administration/doc/README.md) · [Citizen](../../api/src/Citizen/doc/README.md)
- Applications : [site](../../front/apps/site/doc/README.md) (portail citoyen) · [admin](../../front/apps/admin/doc/README.md) (espace des agents)
- Décision de découpage : [ADR 003](../technique/decisions/003-identite-et-habilitations.md)

## L’API du concours Webcup

C’est le **flux des besoins de la ville**, au fil des 24 heures. Il ne s’agit pas de données de la plateforme : chaque demande décrit une fonctionnalité à interpréter et à construire. La demande D19 exige toutefois que les agents puissent consulter ce flux depuis leur espace (BC `Pilotage`, prévu au [chantier](../chantier/README.md)).

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
<!-- backlinks:end -->
