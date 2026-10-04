# Participation des habitants (lot L19)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Admin](README.md) › Participation
<!-- navigation:end -->

Module `src/modules/participation`, espace « Participation » de l’admin, branché sur le BC [Participation](../../../../api/src/Participation/doc/README.md) (F65, F66, F67, F68). Permissions : `admin.participation.read` (lecture) et `admin.participation.write` (modifications), données aux rôles « Agent municipal » et « Administrateur principal ».

> **État : livré, non testé** (aucun test écrit ni exécuté) **et non vérifié dans un navigateur.**

| Route | Page | Cas d’usage backend |
|---|---|---|
| `/participation` | Projets : liste filtrable par état de publication, formulaire (titre, résumé, description, quartier ou toute la ville, avancement, étapes datées, prochaine étape), brouillon / publier / retirer | `ListManagedProjects`, `SaveProject` |
| `/participation/consultations` | Consultations et avis : création (type, projet rattaché, question, contexte, choix, ouverture et clôture), publication ; résultats en continu ; lecture des réponses sans identité ; « Ce que la ville en a retenu » après la clôture | `ListManagedConsultations`, `SaveConsultation`, `ListConsultationContributions`, `RecordConsultationOutcome` |
| `/participation/idees` | Boîte à idées : file filtrable par statut, changement de statut (motif obligatoire pour « non retenue »), non-publication motivée ou republication ; l’habitant est prévenu dans son espace | `ListIdeaQueue`, `FollowIdea`, `SetIdeaVisibility` |

Navigation : module `participation` déclaré dans `shared/ui/layout/workspace-navigation.ts` (`ModuleCode`, `MODULES`, `moduleForPath`, `MODULE_NAVIGATION`), carte dans `/espaces` (liste locale de `AuthHttpGateway.listSpaces`), routes dans `app/routes.tsx`, libellés dans `breadcrumbs.ts`.

Architecture : port `ParticipationGateway` (adaptateur HTTP `ParticipationHttpGateway`), session par `ParticipationSessionProvider` (adaptateur `auth/core/infrastructure/adapter/participation/AuthParticipationSessionProvider`), RTK Query `participationApi`, injectés dans `kernel.ts`. Erreurs `ParticipationError` : `403` indique la permission manquante, `400` reprend le message de l’API.

Avis sur les services (F76, L26 — non testé, non vérifié dans un navigateur) : page `/participation/avis` (`ui/pages/service-reviews.tsx`, chargée à la demande) — file des avis filtrable par statut (nouveaux d’abord), note, besoin obtenu, contexte, commentaire, « Marquer comme lu » et « Répondre » (l’habitant est prévenu), notes moyennes par service. Endpoints `listServiceReviews` / `handleServiceReview` du `ParticipationGateway`. Contrat : [Participation](../../../../api/src/Participation/doc/README.md#avis-sur-les-services-f76-l26--non-testé-non-vérifié-dans-un-navigateur).

Limites : pas de temps réel ; la carte « Participation » de `/espaces` s’affiche pour tout membre (le contrôle reste côté API).

<!-- backlinks:start -->
---

[← Retour à Admin](README.md)

**Référencé depuis :**

- [Admin](README.md)
- [Participation](../../../../api/src/Participation/doc/README.md)
<!-- backlinks:end -->
