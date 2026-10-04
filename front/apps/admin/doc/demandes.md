# Demandes citoyennes (file des agents)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Demandes citoyennes
<!-- navigation:end -->

Les agents voient les messages et signalements envoyés par les habitants depuis le [site](../../site/doc/parcours-citoyen.md#4-demandes-citoyennes-lot-l2), savent d’un coup d’œil combien attendent une prise en charge et font avancer chaque demande (F22, D17). Règles, statuts et contrat HTTP : [Citizen — demandes](../../../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2).

> **État : livré, ni testé ni vérifié dans un navigateur (🟡).**

## Accès

Point d’entrée `/demandes`, par la carte « Demandes citoyennes » de `/espaces` et par la première barre des modules. La lecture exige `admin.request.read`, le traitement `admin.request.read` + `admin.request.write` (rôle de référence « Agent municipal », voir [Administration](../../../../api/src/Administration/doc/membres-et-habilitations.md)). Sans permission, la page affiche le refus (`403`) expliqué ; sans droit de traitement (`canProcess` à faux), le détail est en lecture seule.

## Parcours livré

1. La page charge la file (`GET /api/citizen/agent/requests`) sur « Tous les états » par défaut (sans filtre de statut), les plus anciennes d’abord, 20 par page. Le titre porte le badge **« N en attente »** (`pendingCount`, indépendant du filtre), annoncé aux lecteurs d’écran.
2. Filtre « État » : tous les états ou l’un des cinq statuts ; pagination si plus de 20 demandes.
3. Liste de cartes : référence, objet, type, date de réception et état. Toute la carte est cliquable, avec une action explicite « Voir la demande ». La carte active indique « Demande ouverte » ; le focus rejoint le panneau de détail, également sur petit écran.
4. Détail : référence, type, objet, état, lieu, service éventuel, message du citoyen, chronologie des étapes avec commentaires.
5. Traitement : choix de l’étape suivante parmi `allowedTransitions` (« Prendre en charge », « Démarrer le traitement », « Marquer comme résolue », « Rejeter »), commentaire visible par le citoyen, **motif obligatoire pour un rejet** (vérifié avant l’envoi et par l’API). `POST /api/citizen/agent/requests/status` avec `expectedStatus` : si un autre agent a changé la demande entre-temps (`409`), message et file rechargée. Une demande résolue ou rejetée est close.
6. États : skeletons au chargement initial, au changement de filtre ou de page et lors du rafraîchissement d’une file vide ; une liste déjà chargée reste visible pendant son actualisation. Les données du filtre précédent ne sont pas affichées sous le nouveau filtre. File vide (« Aucune demande en attente de prise en charge »), erreur avec « Réessayer », refus `403`. Un `401` ferme la session.

## Temps réel

Tant que la file est affichée, l’admin écoute `request.submitted` et `request.status_changed` sur le topic `administration.requests` (accordé par le serveur aux membres ayant `admin.request.read`) et recharge la file ; rafraîchissement de secours toutes les 60 s. Voir [Temps réel](README.md#temps-réel).

## Code

Module `requests` : `core/domain/service-request.ts`, `core/application/{rtk-api/requests.ts, usecases/request-queue.usecase.ts, ports/gateway/request-queue.gateway.ts, ports/provider/request-session.provider.ts, errors/requests.error.ts}`, `core/infrastructure/for-production/gateway/http/request-queue.http.gateway.ts`, `ui/{pages/request-queue.tsx, sections/request-detail.tsx}`. Session fournie par `auth/core/infrastructure/adapter/requests/AuthRequestSessionProvider`. Composition : `shared/core/config/{kernel,dependencies,store}.ts`, route `/demandes` dans `app/routes.tsx`.

## Lot L23 — priorités, urgences médicales, demandes similaires, réponses

🟡 Non testé, non vérifié dans un navigateur. API : [Citizen — demandes à grande échelle](../../../../api/src/Citizen/doc/demandes-a-grande-echelle.md).

- **Priorités (F80)** : la file est triée par priorité puis ancienneté ; filtre « Priorité » ; badge « N urgentes » à côté de « N en attente » ; chaque carte porte `PriorityBadge` (icône + libellé). Dans le détail, panneau « Priorité » : priorité, origine (automatique ou agent), motif, et changement avec motif facultatif (journalisé).
- **Urgence médicale (F86)** : bandeau rouge persistant (`role="alert"`, bordure double, icône) tant qu’une urgence n’est pas prise en charge, avec « Voir la demande » et « Prise en charge » (horodatée, journalisée, disparaît pour tous les agents en temps réel). Badge « Urgence médicale » sur la carte et dans le détail.
- **Demandes similaires (F75)** : panneau « Même problème ? » du détail : origine affichée (« Regroupement proposé par l’IA » ou « Repli : similarité de texte »), sujet, demandes proches avec ressemblance et raisons ; cases à cocher pour « Lier comme un même problème » ; demandes déjà liées, « Retirer cette demande du groupe » et « Traiter tout le groupe » (nouvel état + commentaire ; les demandes pour lesquelles l’étape est impossible sont listées).
- **Réponses (F84)** : panneau « Échanges avec l’habitant » : fil des messages, réponses types facultatives, envoi d’une réponse visible par l’habitant (notifiée). Distinct du commentaire d’étape.
- Temps réel : `request.medical_emergency`, `request.updated`, `request.message_posted` rechargent la file et les panneaux ouverts.
- Code : `requests/ui/sections/{emergency-banner,priority-panel,similar-requests-panel,request-messages}.tsx`, badges dans `request-status-badge.tsx`, endpoints dans `core/application/rtk-api/requests.ts`, port `RequestQueueGateway` étendu.

## Guichet des rendez-vous (L10)

`/demandes/rendez-vous` (entrée « Rendez-vous » du module) : choix du jour (aujourd’hui par défaut, dans le fuseau de la ville), tableau des créneaux (heure, service, lieu, citoyen et référence `RDV-…` s’il est réservé, sinon « Libre »), badge « N réservé(s) ». Avec `admin.request.write` : formulaire « Ouvrir des créneaux » (service du catalogue, premier créneau, durée, nombre, lieu, pièces à apporter) et bouton « Retirer » sur un créneau libre (`409` si un habitant vient de le réserver). Temps réel : `appointment.changed` sur `administration.requests` ; polling de 60 s. API : [Citizen — rendez-vous](../../../../api/src/Citizen/doc/rendez-vous.md). Code : `requests/core/{domain/agent-desk.ts, application/ports/gateway/agent-desk.gateway.ts, application/rtk-api/agent-desk.ts, infrastructure/for-production/gateway/http/agent-desk.http.gateway.ts}`, `requests/ui/pages/appointments.tsx`.

## Inquiétudes des habitants (L14)

`/demandes/inquietudes` (entrée « Inquiétudes » du module) : badge « N à prendre en compte », filtre par état (par défaut « Reçue »), chaque inquiétude avec thème, message et trace des étapes. Avec `admin.request.write` : « Marquer comme prise en compte » (commentaire facultatif) et « Envoyer la réponse » (réponse obligatoire), visibles par l’habitant et notifiées dans son espace. L’identité de l’habitant n’est pas affichée. API : [Citizen — participation](../../../../api/src/Citizen/doc/participation.md). Code : `requests/ui/pages/concerns.tsx` et le port `AgentDeskGateway`.

## Données sensibles (L20/F70 — non testé, non vérifié dans un navigateur)

La file des demandes (lieu des demandes de contact) et la journée des rendez-vous (téléphone du citoyen) reçoivent ces données **masquées par l’API** : l’écran affiche « Masqué — accès réservé ». Un bandeau explique la règle ; un agent qui détient `admin.sensitive-data.read` peut cliquer sur « Afficher les données sensibles » (`?reveal=1`) : l’affichage est inscrit au journal des actions et le rafraîchissement automatique est suspendu tant que les données sont visibles. Composants : `shared/ui/components/custom/sensitive-data.tsx`. Voir [Citizen — compte et sécurité](../../../../api/src/Citizen/doc/compte-et-securite.md) et l’[ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md).

## Limites

- Aucun test automatisé ; parcours non vérifié dans un navigateur.
- Pas d’attribution d’une demande à un agent ni de recherche texte dans la file ; l’identité du citoyen n’est pas affichée (la file ne transporte que l’identifiant interne).
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
- [Citizen — rendez-vous](../../../../api/src/Citizen/doc/rendez-vous.md)
- [Citizen — participation](../../../../api/src/Citizen/doc/participation.md)
- [ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md)
- [Citizen — demandes à grande échelle](../../../../api/src/Citizen/doc/demandes-a-grande-echelle.md)
<!-- backlinks:end -->
