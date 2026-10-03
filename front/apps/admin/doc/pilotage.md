# Flux Nova Terra (pilotage)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Flux Nova Terra
<!-- navigation:end -->

Les agents suivent, depuis leur espace, les demandes que la ville transmet par l’API du concours (D19). Point d’entrée : `/pilotage`, accessible par la carte « Pilotage » de `/espaces` et par le sélecteur de modules de la barre latérale.

## Parcours livré

1. La page charge le flux et affiche la session : vague actuelle, temps écoulé, prochaine vague avec un compte à rebours **indicatif** (calculé depuis l’instant où le serveur a lu l’API), nombre de demandes visibles et total des XP disponibles.
2. Le tableau liste les demandes dans l’ordre de l’API : code, demandeur, difficulté, XP (base + bonus), vague et délai d’arrivée, groupe, message. Filtres par vague et par difficulté ; états « aucune demande » et « aucun résultat pour ces filtres ».
3. Les demandes apparues depuis la dernière consultation sont surlignées et marquées « Nouvelle ». Les codes vus sont mémorisés dans le navigateur par `SeenRequestsLocalStorageGateway` ; à la première visite, les demandes présentes servent de référence et seules les suivantes sont surlignées. « Tout marquer comme vu » retire la mise en évidence.
4. Actualisation automatique toutes les 30 s (`pollingInterval`, suspendue quand l’onglet n’a pas le focus) et bouton « Actualiser ». L’heure de la dernière lecture est affichée.
5. Erreurs compréhensibles, avec « Réessayer » : 503 (clé non configurée sur le serveur), 502 (clé refusée par l’API du concours, ou API injoignable), 403 (rôle « Agent municipal » requis), panne réseau. Si une actualisation échoue, les dernières données restent affichées avec un avertissement. Un 401 invalide la session ; les autres erreurs ne déconnectent pas.

## Contrats et composition

Route et règles : [Pilotage](../../../../api/src/Pilotage/doc/README.md) (`GET /api/pilotage/webcup-feed`, permission `admin.pilotage.read`).

Chaîne : `WebcupFeedPage` → hook `use-webcup-feed` → RTK Query (`pilotageApi` : `getWebcupFeed`, `getSeenRequestCodes`, `markRequestsSeen`) → use cases → ports `WebcupFeedGateway` / `SeenRequestsGateway` → `WebcupFeedHttpGateway` / `SeenRequestsLocalStorageGateway` (`pilotage/core/infrastructure/for-production/gateway`). Session : port `PilotageSessionProvider` du module `pilotage`, implémenté par `AuthPilotageSessionProvider` (`auth/core/infrastructure/adapter/pilotage`) et injecté par le kernel. Les règles d’affichage (filtres, nouveautés, compte à rebours) sont dans `pilotage/core/domain/webcup-feed.ts`.

Tests : `webcup-feed.test.ts` (filtres, nouveautés, compte à rebours) et `webcup-feed.http.test.ts` (contrat HTTP, erreurs 401/403/502/503, cache vidé au changement de session, mémoire des codes vus).

## Limites

La mémoire des demandes vues est propre au navigateur (pas partagée entre agents ni entre appareils). Le compte à rebours dépend de l’annonce de l’API, qui ne garantit pas l’intervalle entre vagues.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [Pilotage](../../../../api/src/Pilotage/doc/README.md)
<!-- backlinks:end -->
