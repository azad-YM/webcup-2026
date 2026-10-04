# Notifications de l’espace citoyen (F49)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Citizen](README.md) › Notifications
<!-- navigation:end -->

Le citoyen est prévenu, dans son espace et sans recharger la page, quand un fait le concerne : sa demande change d’état (F49), un rendez-vous approche ([rappels, F40](rendez-vous.md)), un agent répond à une inquiétude ([participation, F51](participation.md)). Chaque notification est **persistée** : elle reste consultable après coup et se marque comme lue.

> **État : livré côté API et site, non testé** (décision d’économie du chantier : aucun test écrit ni exécuté) et non vérifié dans un navigateur.

## Livré

| Cas d’usage | Route | Accès |
|---|---|---|
| `ListMyNotifications` | `GET /api/citizen/notifications` → `200 { items: CitizenNotification[] (50 plus récentes), unreadCount }` | citoyen connecté (`404` non citoyen, `401`) |
| `MarkMyNotificationsRead` | `POST /api/citizen/notifications/read` `{ ids: string[] }` (vide = toutes) → `200 { read }` | citoyen connecté ; un identifiant d’un autre citoyen est ignoré |
| `RecordCitizenNotification` | commande interne, sans route | listeners de Citizen, rappels de rendez-vous |

Vue `CitizenNotification` : `{ id, kind, title, message, link, createdAt, readAt }` ; `kind` : `request.status_changed` | `appointment.reminder` | `concern.updated` | `idea.updated` (idée suivie par les agents, envoyée par le BC [Participation](../../Participation/doc/README.md) via l’adaptateur `Infrastructure/Adapter/Participation/CitizenParticipationNotifier`, lien `/espace/contributions#IDE-…`) | `security.new_device` (F54 : connexion depuis un nouvel appareil, créée par l’adaptateur `Infrastructure/Adapter/IAM/CitizenAccountSecurityNotifier` qui implémente le port `AccountSecurityNotifier` d’IAM, lien `/espace/securite`, clé `device:{id}` ; voir [IAM — connexion renforcée](../../IAM/doc/connexion-renforcee.md)) ; `link` est un chemin du site (ex. `/espace/demandes?ref=NT-2026-0042`).

### Production des notifications

- `Application/Listener/NotifyCitizenOfRequestStatus` écoute `ServiceRequestStatusChanged` (event.bus, worker) et envoie `RecordCitizenNotificationCommand` sur le `command.bus` (transaction) : « Votre demande NT-2026-0042 est passée à « Prise en charge ». » Libellés identiques à ceux du site.
- **Pas de doublon** : `sourceKey` (ex. `request:{id}:{statut}`, `appointment:{id}:day-before`) est unique par citoyen ; une redélivrance de l’événement ou un cron relancé ne recrée rien.
- **Temps réel** ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)) : l’agrégat enregistre `CitizenNotified` ; `PublishCitizenNotificationRealtime` publie `notification.created` `{ notificationId, kind }` sur `citizen.{citizenId}`. Le site relit l’API ; polling de secours de 60 s.
- **Suppression du compte** : `DoctrineCitizenNotificationRepository` implémente aussi `AccountDataEraser` (notifications effacées dans la transaction de suppression).

### Persistance

Agrégat `Domain/Entity/CitizenNotification`, table `citizen_notifications` (migration `Version20261003110000`) : index `(citizen_id, created_at)`, unicité `(citizen_id, source_key)`.

## Consommateurs

- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md#notifications-de-lespace-f49) : centre « Mes notifications » de `/espace`, pastille sur « Mes demandes », annonce d’une nouvelle notification, lecture automatique à l’ouverture du détail d’une demande.

## Questions ouvertes

- Prévenir aussi hors de la plateforme (e-mail, SMS) ? Non retenu pour le concours.
- Purge des notifications anciennes (aujourd’hui conservées jusqu’à la suppression du compte).

<!-- backlinks:start -->
---

[← Retour à Citizen](README.md)

**Référencé depuis :**

- [Citizen](README.md)
- [Site — parcours citoyen](../../../../front/apps/site/doc/parcours-citoyen.md)
- [IAM — connexion renforcée](../../IAM/doc/connexion-renforcee.md)
<!-- backlinks:end -->
