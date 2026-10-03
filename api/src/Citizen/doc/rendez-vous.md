# Rendez-vous avec un agent (lot L10 : F39, F40)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Rendez-vous
<!-- navigation:end -->

Un habitant prend rendez-vous avec un agent de la mairie : il choisit un service du catalogue, puis un créneau libre ouvert par les agents, et lit une confirmation sans ambiguïté (date, heure, fuseau, durée, lieu, pièces à apporter). Il peut déplacer ou annuler son rendez-vous. Il reçoit un rappel la veille et 2 h avant (F40). Les agents ouvrent les créneaux et consultent les rendez-vous du jour dans l’admin.

> **État : livré côté API, site et admin, non testé** (décision d’économie : aucun test écrit ni exécuté) et non vérifié dans un navigateur.

## Décisions retenues

- **Place** : dans Citizen (relation habitant–mairie), sans sous-domaine dédié pour l’instant ; agrégats `AppointmentSlot` et `Appointment`.
- **Créneaux proposés par les agents** : un créneau = un rendez-vous ; un agent ouvre une série de créneaux consécutifs (service, jour, heure du premier créneau, durée 5–240 min, nombre 1–20, lieu, pièces à apporter). Le nom du service, le lieu et les consignes sont **recopiés** dans le créneau puis dans le rendez-vous : la confirmation ne change pas si le catalogue évolue.
- **Fuseau** : dates stockées en UTC, présentées dans le fuseau de la ville `Indian/Reunion` (« heure de La Réunion (UTC+4) ») avec le décalage dans l’ISO et une phrase prête à lire (`when` : « lundi 12 octobre 2026 à 9 h 30 »).
- **Droits des agents** : mêmes permissions que la file des demandes, via le port `RequestAccessPolicy` (`admin.request.read` pour consulter, + `admin.request.write` pour gérer les créneaux). Un créneau réservé ne peut pas être retiré (`409`).
- **Catalogue** : le service est vérifié auprès d’Administration via le port `MunicipalServiceDirectory` (`find`, `all`), adaptateur `Administration/Infrastructure/Adapter/Citizen/AdminCitizenServiceDirectory`.
- **Rappels** : commande planifiable `app:appointments:remind` (cron conseillé toutes les 10 min). Un rendez-vous confirmé reçoit au plus un rappel « veille » (< 24 h) et un rappel « 2 h avant » ; à moins de 2 h, seul ce dernier part. Chaque rappel est une [notification](notifications.md) persistée, poussée en temps réel.

## Livré

| Cas d’usage | Route | Accès |
|---|---|---|
| `ListAppointmentSlots` | `GET /api/citizen/appointments/slots?serviceId=` → `{ services: [{serviceId, serviceName, openSlots, nextWhen}], slots: Slot[] (si serviceId), timezone, timezoneLabel }` | compte connecté |
| `ListMyAppointments` | `GET /api/citizen/appointments` → `{ items: Appointment[] }` | citoyen (`404` sinon) |
| `BookAppointment` | `POST /api/citizen/appointments` `{ slotId }` → `Appointment` | citoyen ; `409` créneau déjà pris ou commencé ; `404` créneau inconnu |
| `ChangeMyAppointment` | `POST /api/citizen/appointments/change` `{ appointmentId, slotId \| null }` (null = annuler) → `Appointment` | auteur ; `409` rendez-vous passé/annulé ou créneau pris |
| `ListAppointmentDay` | `GET /api/citizen/agent/appointments?date=YYYY-MM-DD` → `{ date, timezone, timezoneLabel, items: (Slot + appointment {id, reference, status, citizenName, citizenPhone} \| null)[], bookedCount, canManage, services }` | `admin.request.read` ; `400` date invalide |
| `OpenAppointmentSlots` | `POST /api/citizen/agent/appointment-slots` `{ serviceId, date, startTime "HH:MM", durationMinutes, count, location?, instructions? }` → `{ items: Slot[] }` | `admin.request.read` + `write` ; `422` service inconnu, créneau passé |
| `RemoveAppointmentSlot` | `POST /api/citizen/agent/appointment-slots/remove` `{ slotId }` | idem ; `409` créneau réservé |
| `SendAppointmentReminders` | CLI `php bin/console app:appointments:remind` | cron |

Vue `Slot` : `{ id, serviceId, serviceName, startsAt, endsAt, durationMinutes, location, instructions, timezone, timezoneLabel, when, booked }`. Vue `Appointment` : `{ id, reference (RDV-XXXXXXXX), status: confirmed|cancelled, serviceId, serviceName, startsAt, endsAt, durationMinutes, location, instructions, timezone, timezoneLabel, when, canChange, createdAt, updatedAt }`.

### Temps réel

`AppointmentChanged` (pris, déplacé, annulé) → `PublishAppointmentRealtime` publie `appointment.changed` `{ appointmentId, status }` sur `citizen.{citizenId}` et `administration.requests`. Les rappels publient `notification.created`.

### Persistance

Tables `citizen_appointment_slots` (unicité de `appointment_id` : une réservation par créneau ; verrou optimiste `version`) et `citizen_appointments` (unicité de `reference`), migration `Version20261003110100`. Suppression du compte : `DoctrineAppointmentRepository` (aussi `AccountDataEraser`) libère les créneaux puis efface les rendez-vous.

## Consommateurs

- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md#rendez-vous-espacerendez-vous-f39-f40) : `/espace/rendez-vous`.
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md#guichet-des-rendez-vous-l10) : `/demandes/rendez-vous`.

## Questions ouvertes

- Fuseau officiel de Nova Terra (La Réunion retenu par défaut, constante `Citizen\Domain\CityTime`).
- Plages fixes récurrentes par service (aujourd’hui : séries ouvertes à la main par jour).
- Permission dédiée « rendez-vous » plutôt que celles des demandes.
- Annulation d’un rendez-vous par un agent (avec message au citoyen).

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [Notifications](notifications.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [Admin — demandes citoyennes](../../../../front/apps/admin/doc/demandes.md)
<!-- backlinks:end -->
