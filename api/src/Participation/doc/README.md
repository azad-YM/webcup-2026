# Documentation — Participation

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Participation
<!-- navigation:end -->

## Mission

Participation est le BC de **l’association des habitants aux décisions de la ville** ([ADR 008](../../../../doc/technique/decisions/008-bc-participation.md)) : sur quoi la ville les consulte, ce qu’ils ont répondu, et ce que la ville en a retenu. Il répond aussi aux idées spontanées des habitants.

Responsabilités :

- **Projets** (F67) : ce que la ville étudie, construit ou a terminé, par quartier, avec des étapes datées et la prochaine étape ;
- **Consultations** (F65) et **demandes d’avis** (F66) : une question sur une période d’ouverture, un résultat agrégé publié à la clôture et un compte rendu « Ce que la ville en a retenu » ;
- **Contributions** : la réponse de chaque citoyen, avec un accusé de réception (numéro et date), visible dans « Mes contributions » ;
- **Idées** (F68) : propositions des citoyens, suivies par les agents et publiques sauf décision motivée.

Hors périmètre : les soutiens de signalements (F52) et les inquiétudes (F51) du lot L14 restent dans [Citizen](../../Citizen/doc/participation.md) ; les notifications appartiennent à Citizen ; les quartiers et les droits des agents à [Administration](../../Administration/doc/README.md).

## Consommateurs

- Le [site](../../../../front/apps/site/doc/README.md), module `participation` : pages publiques `/projets`, `/projets/projet?id=…`, `/participer`, `/participer/consultation?id=…`, `/participer/idees`, et `/espace/contributions` ; bloc composé dans `/espace/participation` ([parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)).
- L’[admin](../../../../front/apps/admin/doc/README.md), module `participation` : espace « Participation » (`/participation`, `/participation/consultations`, `/participation/idees`).
- Citizen, par le port `AccountDataEraser` (effacement à la suppression du compte).
- Utilisateurs finaux : visiteurs (lecture), citoyens connectés (contributions, idées), agents municipaux et administrateurs (`admin.participation.read`, `admin.participation.write`).

## Glossaire

| Terme | Définition |
|---|---|
| Projet | Réalisation de la ville présentée aux habitants ; avancement `study` (à l’étude), `in_progress` (en cours), `done` (terminé). |
| Étape | Jalon daté d’un projet (`label`, `date` AAAA-MM-JJ, `done`). |
| Consultation | Question posée aux habitants entre `opensAt` et `closesAt`. Type `consultation` : un choix parmi 2 à 10 options et un commentaire facultatif. |
| Avis (`opinion`) | Consultation **non officielle** : appréciation simple (`positive`, `mixed`, `negative`) et/ou texte libre. Toujours présentée comme « pas un vote ». |
| Période (`phase`) | Dérivée des dates : `upcoming`, `open`, `closed`. |
| Contribution | Réponse d’un citoyen à une consultation ; une seule par citoyen, modifiable pendant l’ouverture ; numéro `CTR-…`. |
| Résultat agrégé | Nombre de réponses par choix ou par appréciation, nombre de commentaires ; public après la clôture. |
| Ce que la ville en a retenu | Compte rendu rédigé par les agents après la clôture (trace de prise en compte). |
| Idée | Proposition d’un citoyen, numéro `IDE-…` ; statuts `received`, `in_review`, `accepted`, `rejected` (motif obligatoire), `done`. |

## User stories

- En tant que visiteur, je consulte les projets en cours et je les filtre par quartier et par avancement (F67).
- En tant que citoyen, je réponds à une consultation ouverte ou je donne un avis non officiel, je reçois un numéro et une date, et je peux modifier ma réponse jusqu’à la clôture (F65, F66).
- En tant que citoyen, je retrouve mes contributions et je vois le résultat, puis ce que la ville en a retenu (F65).
- En tant que citoyen, je propose une idée, je reçois un accusé de réception et je suis prévenu à chaque changement de statut (F68).
- En tant qu’agent, je publie des projets et des consultations, je lis les réponses sans l’identité des habitants, je rédige le compte rendu, je fais avancer les idées et je peux ne pas publier une idée inappropriée en donnant le motif.

## Livré (lot L19, non testé, non vérifié dans un navigateur)

- Projets : création, révision, publication, retrait ; liste publique filtrable et détail avec les consultations du projet.
- Consultations et avis : création, révision (type et choix figés dès la première réponse), publication, retrait ; liste publique par période ; participation du citoyen avec accusé de réception ; résultats agrégés publics à la clôture (visibles des agents en continu) ; lecture des réponses par les agents ; compte rendu.
- Idées : dépôt avec accusé de réception, liste publique, file des agents, changement de statut (motif obligatoire pour « non retenue »), non-publication motivée ; notification de l’auteur (`idea.updated`) via Citizen.
- « Mes contributions » : réponses et idées du citoyen connecté.
- Journal des actions des agents ; effacement des contributions et idées à la suppression du compte.
- Aucun test automatisé (décision d’économie du chantier).

## Règles

- Projet : titre (200), résumé (1 000), description (1 à 50 paragraphes), quartier de la liste fermée ou `null` (toute la ville), 30 étapes au plus, prochaine étape (500). Les étapes sont triées par date.
- Consultation : titre (200), question (1 000), contexte (0 à 50 paragraphes), `closesAt` strictement après `opensAt`, projet rattaché existant. Seule une consultation **publiée** est visible ; elle accepte des réponses seulement pendant sa période d’ouverture.
- Dès qu’une réponse existe, le **type et les choix ne changent plus** (le sens des réponses serait modifié) ; titre, contexte et dates restent modifiables.
- Contribution : `consultation` → `choice` obligatoire parmi les options ; `opinion` → appréciation et/ou commentaire (au moins l’un des deux). Commentaire de 3 000 caractères au plus. Une seule contribution par citoyen et consultation (contrainte d’unicité) ; un nouvel envoi la remplace et garde la date du premier envoi.
- Résultats publics : uniquement après la clôture. Le texte des commentaires n’est jamais public ; les agents les lisent sans identité.
- Compte rendu : seulement sur une consultation publiée et close ; une liste vide le retire.
- Idée : titre (160), description (5 000), quartier facultatif de la liste fermée. Un statut ne peut pas être répété ; `rejected` exige un motif. La non-publication exige un motif ; l’auteur voit toujours son idée et le motif.
- Notification de l’auteur à chaque changement de statut ou de visibilité (`sourceKey` unique : pas de doublon en cas de rejeu).
- Les numéros (`CTR-`, `IDE-`) reprennent les 10 derniers caractères hexadécimaux de l’UUID v7 (partie aléatoire).

## Contrat HTTP

Format d’erreur commun `{path, message}` : `400` règle métier refusée (message français affichable), `403` sans permission, `404` introuvable ou compte non citoyen (routes `/me`), `422` payload invalide, `401` anonyme sur une route protégée.

### Lecture publique (sans compte)

| Route | Réponse |
|---|---|
| `GET /api/participation/projects?district=&status=` | `{items: [Projet]}` publiés, le plus récemment mis à jour d’abord ; `district=city` pour les projets de toute la ville |
| `GET /api/participation/projects/{id}` | Projet publié + `consultations: [Consultation]` publiées du projet, sinon `404` |
| `GET /api/participation/consultations?phase=` | `{items: [Consultation + projectTitle]}` : ouvertes (clôture la plus proche d’abord), à venir, closes |
| `GET /api/participation/consultations/{id}` | Consultation publiée + `projectTitle`, sinon `404` |
| `GET /api/participation/ideas?status=` | `{items: [Idée publique]}` (200 plus récentes) |

Projet : `{id, title, summary, description[], district, status, steps[{label, date, done}], nextStep, publishedAt, updatedAt}`.

Consultation : `{id, projectId, kind, official: false, title, question, description[], options[{id, label}], opensAt, closesAt, phase, contributionCount, results, outcome, publishedAt}` ; `results` est `null` avant la clôture, sinon `{total, choices[{id, label, count}], ratings[{rating, count}], comments}` ; `outcome` : `{text[], publishedAt}` ou `null`.

Idée publique : `{id, reference, title, description, district, status, statusComment, createdAt, updatedAt}` (sans auteur).

### Citoyen connecté (JWT)

| Route | Corps | Réponse |
|---|---|---|
| `GET /api/participation/me` | — | `{contributions: [Accusé + consultation{id, title, kind, options, closesAt, phase, visible}], ideas: [Idée suivie]}` |
| `PUT /api/participation/me/contributions` | `{consultationId, choice?, rating?, comment?}` | Accusé de réception `{id, reference, consultationId, choice, rating, comment, submittedAt, updatedAt, revised, consultationTitle, closesAt}` |
| `POST /api/participation/me/ideas` | `{title, description, district?}` | Idée suivie (accusé de réception) |

Idée suivie : idée publique + `{public, hiddenReason, trail[{status, at, comment}]}`. `404` si le compte n’est pas citoyen.

### Agents

| Route | Permission | Corps | Réponse |
|---|---|---|---|
| `GET /api/participation/manage/projects` | read | — | Tous les projets (+ `state`, `createdAt`) |
| `PUT /api/participation/manage/projects` | write | `{id?, title, summary, description[], district?, status, steps[], nextStep?, state}` | Le projet enregistré |
| `GET /api/participation/manage/consultations` | read | — | Toutes les consultations, résultats inclus (+ `state`, `updatedAt`, `createdAt`) |
| `PUT /api/participation/manage/consultations` | write | `{id?, projectId?, kind, title, question, description[], options[] (libellés), opensAt, closesAt, state}` | La consultation enregistrée |
| `PUT /api/participation/manage/consultations/outcome` | write | `{consultationId, outcome[]}` | La consultation |
| `GET /api/participation/manage/consultations/{id}/contributions` | read | — | `{items: [{reference, choice, rating, comment, submittedAt, updatedAt}]}` sans identité |
| `GET /api/participation/manage/ideas?status=` | read | — | `{items: [Idée suivie]}`, plus anciennes d’abord, non publiées incluses (300 au plus) |
| `PUT /api/participation/manage/ideas/status` | write | `{ideaId, status: in_review\|accepted\|rejected\|done, comment?}` | L’idée |
| `PUT /api/participation/manage/ideas/visibility` | write | `{ideaId, public, reason?}` | L’idée |

Toutes les conditions sont vérifiées avant l’enregistrement : un refus n’enregistre rien.

Journal (`AuditTrail`) : `participation.project.{created,updated,published,withdrawn}`, `participation.consultation.{created,updated,published,withdrawn,outcome_recorded}`, `participation.idea.{status_changed,hidden,published}`.

## Raccordements

| Port | Adaptateur | Besoin |
|---|---|---|
| `Ports/Provider/ParticipationAccessPolicy` | `Administration/Infrastructure/Adapter/Participation/AdminParticipationAccessPolicy` | `admin.participation.read` / `write` |
| `Ports/Provider/DistrictDirectory` | `Administration/Infrastructure/Adapter/Participation/AdminParticipationDistrictDirectory` | liste fermée des quartiers |
| `Ports/Provider/ParticipantProvider` | `Citizen/Infrastructure/Adapter/Participation/CitizenParticipantProvider` | identifiant du citoyen connecté (`null` si non citoyen) |
| `Ports/Provider/CitizenNotifier` | `Citizen/Infrastructure/Adapter/Participation/CitizenParticipationNotifier` | notification `idea.updated` (cas d’usage `RecordCitizenNotification` de Citizen) |
| Citizen `AccountDataEraser` | `Participation/Infrastructure/Adapter/Citizen/ParticipationAccountDataEraser` | efface contributions et idées (cas d’usage interne `EraseParticipantData`) |

Câblage : autoload `Participation\`, `config/services.yaml` (alias des ports), `config/routes.yaml`, mapping Doctrine `Participation`, règles `PUBLIC_ACCESS` en lecture dans `security.yaml`. Tables `participation_projects`, `participation_consultations`, `participation_contributions`, `participation_ideas` et permissions des rôles de référence : migration `Version20261003122000`.

## Questions ouvertes

- Temps réel (nouvelle consultation, résultats) : aujourd’hui rafraîchissement de secours de 60 s.
- Effacement à la suppression du compte : les contributions sortent des résultats agrégés, y compris d’une consultation close ; faut-il plutôt anonymiser pour figer les résultats publiés ?
- Deux premiers envois simultanés d’un même citoyen : la contrainte d’unicité refuse le second par une erreur technique (pas de message dédié).
- Notifier les participants à la clôture et à la publication du compte rendu (non fait : seules les idées notifient).
- Modération des commentaires de consultation (non publics aujourd’hui) et des idées avant publication (aujourd’hui : publication immédiate, retrait motivé a posteriori).
- Pas de lien vers l’activité de Pilotage (F50) ni d’entrée dans le tableau de bord.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [ADR 008](../../../../doc/technique/decisions/008-bc-participation.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Citizen — participation](../../Citizen/doc/participation.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
<!-- backlinks:end -->
