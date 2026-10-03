# Agent backend Communication

Lire d’abord [la documentation locale](doc/README.md) (mission, contrat HTTP, topics temps réel) et l’[ADR 005](../../../doc/technique/decisions/005-bc-communication.md).

Communication porte les **publications** (actualités, annonces importantes) et les **alertes** (gravité, validité, audience, recommandations rédigées à la main). Le catalogue des services reste dans Administration.

Règles :

- Autorisation des agents : port `Application/Ports/Provider/CommunicationAccessPolicy`, implémenté par Administration (`admin.communication.write`). Liste fermée des quartiers : port `DistrictDirectory`, implémenté par Administration. Audience du citoyen connecté : port `AudienceProvider`, implémenté par Citizen. Ne jamais importer une classe d’un autre BC.
- Aucune donnée sanitaire : l’audience `health` repose uniquement sur le consentement explicite géré par Citizen.
- Les agrégats enregistrent leurs événements (`PublicationPublished`, `AlertPublished`, `AlertWithdrawn`) ; le repository les envoie sur `event.bus`. Le temps réel passe uniquement par `Application/EventHandler/ProjectCommunicationToRealtime` et le port `RealtimePublisher`, avec des événements temps réel distincts (`alert.published`, `alert.withdrawn`, `publication.important`, `publication.published`) et un payload limité aux identifiants, à la gravité et au quartier.
- Topics : `public.alerts`, `public.publications`, `district.{quartier}`, `alerts.health` (`Application/RealtimeTopics`). Les topics privés sont accordés par `Citizen/Infrastructure/Adapter/Shared/CitizenAlertRealtimeAudience` : toute évolution des noms se fait des deux côtés et dans la doc.
- Le contrat HTTP de la doc est consommé par le site et l’admin : le faire évoluer dans la doc d’abord.

Tests : aucune suite pour l’instant (décision d’économie du chantier) ; en ajouter une `Communication` dans `phpunit.dist.xml` au premier test.
