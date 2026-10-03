# Vitrine, alertes et notifications

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Vitrine et alertes
<!-- navigation:end -->

Ce que voit un habitant de Nova Terra, connecté ou non : les services de la ville, leurs perturbations, les horaires des transports, les actualités et les alertes. Lots L3, L7 et L9 du [chantier](../../../../doc/chantier/README.md) ; **non vérifié dans un navigateur**.

## Parcours

| Parcours | Écran | Cas d’usage backend | Demandes |
|---|---|---|---|
| Trouver un service par mot-clé ou thème | `/services?q=…&categorie=…` (filtrage dans la page, adresse partageable) | [Administration](../../../../api/src/Administration/doc/README.md#services-municipaux-et-quartiers-lots-l3-et-l9-non-vérifiés-dans-un-navigateur) `GET /api/administration/services` | D05, F32 |
| Voir les services les plus demandés | accueil, « Services les plus demandés » (`featured`) | idem | F28, D07 |
| Savoir si un service est perturbé avant une démarche | carte du service (pastille) et fiche `/services?service=…` : état, message, retour prévu, alternative | idem | F38 |
| Consulter les horaires des transports | fiche d’un service de mobilité (`/services?service=transports`) | idem | F36 |
| Lire les actualités | `/actualites`, `/actualites?article=…` ; pastille « Annonce importante » | [Communication](../../../../api/src/Communication/doc/README.md#contrat-http) `GET /api/communication/publications` | D06 |
| Voir une alerte de la ville | bandeau sous l’en-tête de toutes les pages, du plus grave au moins grave ; recommandations dépliables | `GET /api/communication/alerts` (+ notifications si connecté) | D18 |
| Être prévenu d’une alerte de son quartier ou d’une annonce importante | bandeau et section « Notifications de la ville » de `/espace` | `GET /api/communication/me/notifications` | F29, F30 |
| Recevoir les recommandations aux personnes vulnérables | case « Je souhaite recevoir les alertes sanitaires… » de `/espace` (facultatif, révocable) | [Citizen](../../../../api/src/Citizen/doc/README.md#quartier-et-préférences-dalerte-lot-l7-non-vérifié-dans-un-navigateur) `GET/PUT /api/citizen/me/alert-preferences` | F31 |
| Choisir son quartier | sélecteur du profil `/espace/profil`, alimenté par la liste fermée | `GET /api/administration/districts`, `PUT /api/citizen/me` | F29 |

## Temps réel

- Port `public/core/application/ports/gateway/city-feed.gateway.ts` (`CityFeedGateway`), implémenté par `SseCityFeedGateway` avec le client commun `@boilerplate/shared-utils/realtime` ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)). Un seul flux `GET /api/realtime/stream` pour tout le module, ouvert au premier abonné.
- Sans session : topics publics `public.alerts` et `public.publications`. Avec une session : ticket `POST /api/realtime/tickets` ; le serveur ajoute les topics privés (quartier, alertes sanitaires). Le flux est rouvert à la connexion et à la déconnexion.
- À réception de `alert.published` ou `alert.withdrawn`, RTK Query invalide le bandeau et les notifications ; `publication.*` invalide les actualités, `publication.important` les notifications.
- Filet de sécurité : `pollingInterval` de 60 s sur le bandeau, les notifications, les services et les actualités.

## États

Chargement, erreur avec « Réessayer » et liste vide sont distincts sur chaque liste. Le bandeau reste masqué en l’absence d’alerte ou en cas d’erreur (la page n’est pas bloquée). Pour un compte non citoyen (agent), la section notifications n’est pas affichée ; un `401` ferme la session.

## Limites

- Aucun test n’a été écrit ni relancé pour ces écrans (décision d’économie) ; les tests existants de la vitrine utilisent encore les adaptateurs locaux.
- Le début et la fin de validité d’une alerte n’émettent pas d’événement : l’affichage suit au plus tard 60 s après.
- Le module `public` ouvre son propre flux ; le flux des demandes (lot L2) devra être fusionné avec lui pour garder un seul flux par onglet.

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Parcours citoyen](parcours-citoyen.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
