# Participation des habitants (lot L14 : F51, F52)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Participation
<!-- navigation:end -->

Les habitants comprennent l’usage de leurs données et font remonter leurs inquiétudes avec une trace de prise en compte (F51) ; ils soutiennent les signalements déjà déposés par d’autres (F52).

> **État : livré côté API, site et admin, non testé** (décision d’économie : aucun test écrit ni exécuté) et non vérifié dans un navigateur.

> Les projets, consultations, avis et la boîte à idées (lot L19 : F65 à F68) appartiennent au BC [Participation](../../Participation/doc/README.md) ; la page `/espace/participation` les réunit par composition.

## Vos données (F51)

Page publique statique `/vos-donnees` du [site](../../../../front/apps/site/doc/parcours-citoyen.md#participer-espaceparticipation-f51-f52) : tableau « donnée / pourquoi / combien de temps / qui y accède » et « vos droits ». Inventaire de référence (à tenir à jour avec les BC propriétaires) :

| Donnée | Propriétaire | Conservation |
|---|---|---|
| E-mail, empreinte du mot de passe | IAM | durée du compte ; anonymisés à la suppression |
| Profil facultatif, quartier, consentement aux alertes sanitaires (sans donnée de santé) | Citizen | durée du compte ; effacés à la suppression |
| Demandes et étapes | Citizen | conservées, détachées de l’identité à la suppression (citoyen anonymisé) |
| Rendez-vous, soutiens, inquiétudes, notifications | Citizen | durée du compte ; effacés à la suppression (`AccountDataEraser`) |
| Journal des tentatives de connexion | IAM | 90 jours |

## Inquiétudes (F51)

| Cas d’usage | Route | Accès |
|---|---|---|
| `RaiseConcern` | `POST /api/citizen/concerns` `{ topic: data\|service\|security\|other, subject (≤160), message (≤5000) }` → `Concern` (accusé de réception) | citoyen |
| `ListMyConcerns` | `GET /api/citizen/concerns` → `{ items: Concern[] }` | citoyen |
| `ListConcernQueue` | `GET /api/citizen/agent/concerns?status=` → `{ items, receivedCount, canProcess }` (100 plus anciennes) | `admin.request.read` ; `400` statut inconnu |
| `HandleConcern` | `POST /api/citizen/agent/concerns/handle` `{ concernId, status: in_review\|answered, comment? }` → `Concern` | `admin.request.read` + `write` ; `422` réponse manquante |

Vue `Concern` : `{ id, reference (INQ-XXXXXXXX), topic, subject, message, status: received|in_review|answered, response, trail: [{status, at, comment}], createdAt, updatedAt }`. La première étape `received` est l’accusé de réception ; chaque action d’un agent ajoute une étape visible du citoyen. `ConcernUpdated` → `NotifyCitizenOfConcern` crée une [notification](notifications.md) `concern.updated` (lien `/espace/participation#INQ-…`). L’agent ne voit pas l’identité du citoyen. Table `citizen_concerns` (migration `Version20261003110300`).

## Soutien d’une demande (F52)

- **Signalement public sur choix de l’auteur** : case facultative du formulaire (`isPublic` dans `POST /api/citizen/requests`, ignorée pour un message `contact`). Seuls la référence, l’objet, le lieu, l’état et la date sont montrés aux autres habitants ; jamais l’auteur ni la description. Colonne `is_public` (défaut `0`, aussi dans le mapping) sur `citizen_service_requests`.
- **Un soutien par citoyen** (unicité `(request_id, citizen_id)`), impossible sur sa propre demande ou sur une demande close (`422`), idempotent.

| Cas d’usage | Route | Accès |
|---|---|---|
| `ListPublicRequests` | `GET /api/citizen/public-requests` → `{ items: [{ id, reference, subject, location, status, createdAt, supportCount, supportedByMe, mine }] }` (50 plus récentes, non closes) | citoyen |
| `SupportRequest` | `POST /api/citizen/public-requests/support` `{ requestId, support: bool }` → même vue | citoyen ; `404` demande privée ou inconnue |

La vue `ServiceRequest` porte désormais `isPublic` et `supportCount` (« Mes demandes »). Table `citizen_request_supports` (migration `Version20261003110200`).

## Consommateurs

- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md#participer-espaceparticipation-f51-f52) : `/espace/participation`, `/vos-donnees`, case « Rendre ce signalement visible ».
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md#inquiétudes-des-habitants-l14) : `/demandes/inquietudes`.

## Questions ouvertes

- Rendre la liste des signalements publics consultable sans compte (aujourd’hui : citoyen connecté).
- Modération des signalements publics par un agent (masquer un objet inapproprié).
- Permission dédiée pour les inquiétudes (aujourd’hui celles des demandes).

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [Notifications](notifications.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md)
- [Participation (BC)](../../Participation/doc/README.md)
<!-- backlinks:end -->
