# Demandes à grande échelle (lot L23)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Demandes à grande échelle
<!-- navigation:end -->

Quand les demandes affluent, les agents doivent voir d’abord ce qui est urgent, reconnaître les demandes qui parlent du même problème, répondre directement aux habitants ; une urgence médicale ne doit jamais attendre dans la file comme une demande ordinaire. Les habitants retrouvent leurs demandes par sujet et gardent un accusé de réception comme preuve.

> **État : 🟡 livré côté API, admin et site ; aucun test automatisé, non vérifié dans un navigateur.** Demandes Webcup : F80, F86, F75 (IA), F84, F83, F79.

Consommateurs : la file des agents de l’[admin](../../../../front/apps/admin/doc/demandes.md#lot-l23--priorités-urgences-médicales-demandes-similaires-réponses) et « Mes demandes », le formulaire et les signalements publics du [site](../../../../front/apps/site/doc/parcours-citoyen.md#lot-l23--urgence-médicale-échanges-accusé-de-réception-filtres).

## Livré

### Priorité des dossiers (F80)

- Chaque demande porte `priority` (`urgent`, `high`, `normal`, `low`), `priorityReason` (phrase lisible) et `prioritySource` (`auto` ou `agent`). Règles automatiques, explicables, dans `Domain/Service/RequestTriage` : urgence médicale → `urgent` ; danger immédiat (incendie, fuite de gaz, inondation, câble à terre…) → `urgent` ; gêne importante ou risque (panne, accident, trou, école…) ou catégorie sécurité → `high` ; simple information d’un message → `low` ; sinon `normal`.
- Montées automatiques : un signalement public soutenu par au moins 10 habitants passe au moins `high` (recalcul à chaque soutien) ; une demande encore « envoyée » après 7 jours monte d’un cran (cron `php bin/console app:requests:reprioritize`, toutes les heures conseillé). Une priorité fixée par un agent n’est jamais modifiée par les règles.
- L’agent change la priorité avec un motif facultatif (`SetRequestPriority`, journalisé `citizen.request.priority_changed`). Une urgence médicale reste `urgent` tant qu’elle n’est pas prise en charge.
- File des agents triée par priorité puis ancienneté (`priority_rank`, `created_at`) ; filtre `priority` ; compteur `urgentCount` (demandes non closes urgentes).

### Urgence médicale (F86)

- `POST /api/citizen/requests` accepte `medicalEmergency` (case du site). L’API détecte aussi les mots d’une urgence médicale dans l’objet et la description. La demande reçoit alors `medicalEmergency: true`, la catégorie `medical_emergency`, la priorité `urgent` ; elle n’est jamais rendue publique.
- Accusé spécifique : notification `request.medical_emergency` dans l’espace de l’habitant (« appelez le 15 ou le 112 », lien vers `/urgences`) et rappel dans l’accusé de réception et l’e-mail.
- Alerte temps réel immédiate `request.medical_emergency` sur `administration.requests` (en plus de `request.submitted`), projetée par le worker.
- `GET /api/citizen/agent/requests` renvoie `pendingEmergencies` (urgences non closes pas encore prises en charge : id, référence, objet, date) pour un bandeau persistant.
- « Prise en charge » : `MarkEmergencyHandled` horodate (`emergencyHandledAt`, agent dans `emergency_handled_by`), passe la demande « prise en charge » si elle attendait (étape visible par l’habitant), journalise `citizen.request.emergency_handled` et publie `request.updated`.

### Demandes similaires (F75, IA)

- `GET /api/citizen/agent/requests/{id}/similar` : demandes ouvertes des 60 derniers jours qui semblent parler du même problème, et membres du groupe déjà lié.
- **Repli local, toujours calculé** (`Application/Service/SimilarRequestFinder`) : normalisation (minuscules, sans accents), mots vides français retirés, Jaccard sur les mots, trigrammes de l’objet, même catégorie, même quartier, même lieu (signalements seulement), même service, proximité dans le temps. Seuil 30 %.
- **Avec le port `LanguageModel`** : les candidats (y compris les cas ambigus entre 18 et 30 %) sont soumis au modèle, qui renvoie un libellé de sujet court et la liste des candidats retenus (JSON, parsing tolérant). Le prompt ne contient ni nom ni identifiant de citoyen, ni le lieu d’un message privé ; e-mails et numéros sont masqués. Résultat mis en cache 6 h (échec : 30 s). Sans clé ou en cas d’échec : repli local.
- La réponse indique `source: "ai" | "local"`, `topic`, `groupId`, `group[]`, `items[]` (référence, objet, état, priorité, catégorie, quartier, date, `score` en %, `reasons[]`).
- Lier (`LinkRequests`, deux groupes liés fusionnent), délier (`UnlinkRequest`, un groupe d’une seule demande disparaît) et traiter le groupe (`ChangeGroupStatus` : chaque demande qui permet la transition change d’état, les autres sont listées comme ignorées ; motif obligatoire pour un rejet). Journal : `citizen.request.linked`, `citizen.request.unlinked`, `citizen.request.group_status_changed`.

### Réponse directe des agents (F84)

- Agrégat `RequestMessage` (table `citizen_request_messages`) : fil agent ↔ habitant, distinct des commentaires d’étape. L’agent n’est jamais nommé côté habitant (« La mairie »).
- Agent : `GET /api/citizen/agent/requests/{id}/messages`, `POST /api/citizen/agent/requests/messages` (`admin.request.write`, journalisé `citizen.request.replied`, sans le texte). Habitant : `GET /api/citizen/requests/{reference}/messages` (`canReply` faux si la demande est close), `POST /api/citizen/requests/messages` (limité à 20 / 10 min).
- Une réponse d’agent crée une notification `request.message` ; chaque message publie `request.message_posted` sur `citizen.{id}` et `administration.requests`. `messageCount` est ajouté aux vues des demandes.

### Accusé de réception (F83)

- `GET /api/citizen/requests/{reference}/receipt` : référence, type, objet, service (nom via `MunicipalServiceDirectory`), date et heure, empreinte courte (`XXXXX-XXXXX`, HMAC du secret de l’application sur id, référence, date, objet — `Infrastructure/Security/HmacRequestReceiptSigner`).
- E-mail après l’envoi, si le compte a une adresse (`SendRequestReceipt`, worker ; e-mail via `CitizenAccountManager::emails`, envoi Mailer `SendEmailMessage` en async). Un échec d’envoi est journalisé sans bloquer.
- Vérification publique : `POST /api/citizen/receipts/verify` `{reference, fingerprint}` → `{valid, reference, submittedAt}` ; une référence inconnue et une empreinte fausse donnent la même réponse ; aucun contenu révélé ; limité à 20 / 10 min.

### Filtres par sujet (F79)

- Chaque demande porte `category` (déduite du texte : `safety`, `water`, `roads`, `lighting`, `cleanliness`, `noise`, `administrative`, `other`, `medical_emergency`) et `district` (quartier choisi à l’envoi dans la liste d’Administration, sinon celui du profil ; quartier inconnu → `422`).
- Les signalements publics exposent en plus `serviceId`, `category`, `district`. Les filtres et le tri sont faits par le site (listes déjà bornées).

## Modèle et persistance

Colonnes ajoutées à `citizen_service_requests` : `priority`, `priority_rank`, `priority_reason`, `priority_source`, `category`, `district`, `medical_emergency`, `emergency_handled_at`, `emergency_handled_by` (migration `Version20261004100000`), `group_id` (`Version20261004100100`). Table `citizen_request_messages` (`Version20261004100200`). Valeurs par défaut dans le mapping et les migrations ; les demandes existantes restent `normal` / `other` jusqu’au prochain passage du cron.

## Contrat HTTP

| Méthode | Route | Accès | Corps / réponse |
|---|---|---|---|
| POST | `/api/citizen/requests` | habitant | + `medicalEmergency?: bool`, `district?: string \| null` |
| GET | `/api/citizen/agent/requests` | `admin.request.read` | + paramètre `priority` ; réponse + `urgentCount`, `pendingEmergencies[]` ; vues + `priority`, `priorityReason`, `prioritySource`, `category`, `district`, `medicalEmergency`, `emergencyHandledAt`, `groupId`, `messageCount` |
| POST | `/api/citizen/agent/requests/priority` | `admin.request.write` | `{requestId, priority, reason?}` → `ServiceRequest` |
| POST | `/api/citizen/agent/requests/emergency-handled` | `admin.request.write` | `{requestId}` → `ServiceRequest` ; `409` déjà prise en charge, `422` pas une urgence |
| GET | `/api/citizen/agent/requests/{id}/similar` | `admin.request.read` | voir F75 |
| POST | `/api/citizen/agent/requests/link` | `admin.request.write` | `{requestId, otherIds[]}` → `{groupId, references[]}` |
| POST | `/api/citizen/agent/requests/unlink` | `admin.request.write` | `{requestId}` → `{groupId, references[]}` |
| POST | `/api/citizen/agent/requests/group-status` | `admin.request.write` | `{groupId, status, comment?}` → `{changed[], skipped[]}` |
| GET | `/api/citizen/agent/requests/{id}/messages` | `admin.request.read` | `{items: RequestMessage[]}` |
| POST | `/api/citizen/agent/requests/messages` | `admin.request.write` | `{requestId, body ≤ 3000}` → `RequestMessage` |
| GET | `/api/citizen/requests/{reference}/messages` | habitant auteur | `{items, canReply}` |
| POST | `/api/citizen/requests/messages` | habitant auteur | `{reference, body}` → `RequestMessage` ; `422` demande close |
| GET | `/api/citizen/requests/{reference}/receipt` | habitant auteur | `RequestReceipt` |
| POST | `/api/citizen/receipts/verify` | public | `{reference, fingerprint}` → `{valid, reference, submittedAt}` |

`RequestMessage` : `{id, author: "agent" | "citizen", body, createdAt}`. Vues de l’habitant : `groupId` et `priorityReason` retirés. Aucune nouvelle permission : les actions des agents utilisent `admin.request.write`.

## Questions ouvertes

- Faut-il afficher à l’agent le nom de l’agent qui a pris en charge l’urgence (port vers Administration à créer) ?
- Les messages ne figurent pas encore dans l’export « Mes données » (F55).
- Les règles de priorité et les mots-clés sont fixés dans le code : faut-il les rendre réglables par un administrateur ?
- La détection par mots-clés produit des faux positifs (« avc » dans un autre sens, « feu » rouge) : l’agent corrige la priorité, mais une urgence médicale détectée à tort reste urgente jusqu’à sa prise en charge.

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
<!-- backlinks:end -->
