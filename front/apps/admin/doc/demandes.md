# Demandes citoyennes (file des agents)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Demandes citoyennes
<!-- navigation:end -->

Les agents voient les messages et signalements envoyés par les habitants depuis le [site](../../site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2), savent d’un coup d’œil combien attendent une prise en charge et font avancer chaque demande (F22, D17). Règles, statuts et contrat HTTP : [Citizen — demandes](../../../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2).

> **État : livré, ni testé ni vérifié dans un navigateur (🟡).**

## Accès

Point d’entrée `/demandes`, par la carte « Demandes citoyennes » de `/espaces` et par le sélecteur de modules. La lecture exige `admin.request.read`, le traitement `admin.request.read` + `admin.request.write` (rôle de référence « Agent municipal », voir [Administration](../../../../api/src/Administration/doc/membres-et-habilitations.md)). Sans permission, la page affiche le refus (`403`) expliqué ; sans droit de traitement (`canProcess` à faux), le détail est en lecture seule.

## Parcours livré

1. La page charge la file (`GET /api/citizen/agent/requests`) filtrée par défaut sur « En attente » (`submitted`), les plus anciennes d’abord, 20 par page. Le titre porte le badge **« N en attente »** (`pendingCount`, indépendant du filtre), annoncé aux lecteurs d’écran.
2. Filtre « État » : tous les états ou l’un des cinq statuts ; pagination si plus de 20 demandes.
3. Tableau : référence, objet (bouton qui ouvre le détail), type, date de réception, état.
4. Détail : référence, type, objet, état, lieu, service éventuel, message du citoyen, chronologie des étapes avec commentaires.
5. Traitement : choix de l’étape suivante parmi `allowedTransitions` (« Prendre en charge », « Démarrer le traitement », « Marquer comme résolue », « Rejeter »), commentaire visible par le citoyen, **motif obligatoire pour un rejet** (vérifié avant l’envoi et par l’API). `POST /api/citizen/agent/requests/status` avec `expectedStatus` : si un autre agent a changé la demande entre-temps (`409`), message et file rechargée. Une demande résolue ou rejetée est close.
6. États : chargement, file vide (« Aucune demande en attente de prise en charge »), erreur avec « Réessayer », refus `403`. Un `401` ferme la session.

## Temps réel

Tant que la file est affichée, l’admin écoute `request.submitted` et `request.status_changed` sur le topic `administration.requests` (accordé par le serveur aux membres ayant `admin.request.read`) et recharge la file ; rafraîchissement de secours toutes les 60 s. Voir [Temps réel](README.md#temps-réel).

## Code

Module `requests` : `core/domain/service-request.ts`, `core/application/{rtk-api/requests.ts, usecases/request-queue.usecase.ts, ports/gateway/request-queue.gateway.ts, ports/provider/request-session.provider.ts, errors/requests.error.ts}`, `core/infrastructure/for-production/gateway/http/request-queue.http.gateway.ts`, `ui/{layouts/requests.layout.tsx, pages/request-queue.tsx, sections/request-detail.tsx}`. Session fournie par `auth/core/infrastructure/adapter/requests/AuthRequestSessionProvider`. Composition : `shared/core/config/{kernel,dependencies,store}.ts`, route `/demandes` dans `app/routes.tsx`.

## Limites

- Aucun test automatisé ; parcours non vérifié dans un navigateur.
- Pas d’attribution d’une demande à un agent ni de recherche texte ; l’identité du citoyen n’est pas affichée (la file ne transporte que l’identifiant interne).
- Le temps réel dépend du worker Messenger (projection asynchrone) ; sans lui, rafraîchissement toutes les 60 s.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [Admin](README.md)
- [Citizen](../../../../api/src/Citizen/doc/README.md)
- [Site — parcours citoyen](../../site/doc/parcours-citoyen.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
<!-- backlinks:end -->
