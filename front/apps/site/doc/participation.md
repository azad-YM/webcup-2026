# Projets, consultations et boîte à idées (lot L19)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Site](README.md) › Participation
<!-- navigation:end -->

Module `src/modules/participation`, branché sur le BC [Participation](../../../../api/src/Participation/doc/README.md) (F65, F66, F67, F68). Les soutiens et inquiétudes (L14) restent dans le module `citizen` ([parcours citoyen](parcours-citoyen.md)).

> **État : livré, non testé** (aucun test écrit ni exécuté) **et non vérifié dans un navigateur.**

## Parcours

| Route | Public | Contenu | Cas d’usage backend |
|---|---|---|---|
| `/projets` | tous | Projets publiés, filtres quartier (dont « toute la ville ») et avancement | `ListProjects` |
| `/projets/projet?id=…` | tous | Description, avancement, étapes datées, prochaine étape, consultations du projet | `GetProject` |
| `/participer` | tous | Raccourcis (projets, idées, mes contributions), consultations ouvertes, à venir, terminées | `ListConsultations` |
| `/participer/consultation?id=…` | tous ; réponse : citoyen connecté | Question, contexte, mention « avis non officiel » (F66), formulaire (choix ou appréciation + commentaire), accusé de réception (numéro, date, modification possible jusqu’à la clôture), résultats et « Ce que la ville en a retenu » après la clôture | `GetConsultation`, `SubmitContribution`, `ListMyParticipation` |
| `/participer/idees` | tous ; dépôt : citoyen connecté | Idées publiques avec leur statut et la réponse de la ville ; formulaire avec accusé de réception | `ListPublicIdeas`, `ProposeIdea` |
| `/espace/contributions` | citoyen connecté | « Mes contributions » : réponses avec numéro et dates, idées avec leur suivi et le motif éventuel de non-publication | `ListMyParticipation` |
| `/espace/participation` | citoyen connecté | Bloc « Participer aux décisions de la ville » composé par la route (slot `cityParticipation` de la page Citizen) | `ListConsultations` |

Entrées : « Projets » et « Participer » dans la navigation principale (en-tête et pied de page), raccourci « Mes contributions » de `/espace` (pastille des notifications `idea.updated`). Destinations de retour après connexion ajoutées : `/espace/contributions`, `/participer`, `/participer/idees`.

### Avis sur un service (F76, L26 — non testé, non vérifié dans un navigateur)

- `/espace/avis?service=<id>` (avec `demande=<numéro>` ou `rendez-vous=<numéro>`) : note 1 à 5 avec libellés en mots, « Avez-vous obtenu ce dont vous aviez besoin ? », commentaire facultatif ; envoi protégé par `useProtectedSubmit` (formulaire `avis-service`) ; accusé avec numéro ; un avis du mois déjà donné est proposé à la modification. Retour après connexion autorisé pour ce chemin et ses paramètres.
- Proposé depuis le détail d’une demande close (« Mes demandes »), un rendez-vous passé (« Mes rendez-vous ») et la fiche service (`/services?service=…`, bloc « Avis des habitants » avec moyenne et nombre d’avis, sans identité — port `ServiceRatingsProvider` du module `public`, adaptateur `participation/core/infrastructure/adapter/public/ParticipationServiceRatingsAdapter`).
- « Mes contributions » : section « Mes avis sur les services » avec « Lu par le service » / « Réponse du service ».
- Contrat : [Participation](../../../../api/src/Participation/doc/README.md#avis-sur-les-services-f76-l26--non-testé-non-vérifié-dans-un-navigateur).

## Architecture

- Ports : `CityParticipationGateway` (HTTP : `CityParticipationHttpGateway`, quartiers lus sur `GET /administration/districts`) et `ParticipationSessionProvider` (adaptateur `auth/core/infrastructure/adapter/participation/AuthParticipationSessionAdapter`), injectés dans `StoreProvider`.
- RTK Query `cityParticipationApi` (vidé par `resetAccountCaches`). Rafraîchissement de secours de 60 s ; aucun nouveau flux temps réel.
- Un compte sans espace citoyen reçoit un `404` sur `/participation/me…` : message « activez votre espace » avec lien vers `/espace`. Un `401` ferme la session.

## Limites

- Après connexion depuis une consultation, le retour se fait vers `/participer` (liste fermée sans paramètre).
- Pas de mise à jour en temps réel des résultats ou des nouvelles consultations.

<!-- backlinks:start -->
---

[← Retour au Site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Participation](../../../../api/src/Participation/doc/README.md)
<!-- backlinks:end -->
