# Agent backend Participation

Lire d’abord [la documentation locale](doc/README.md) (mission, contrat HTTP, règles) et l’[ADR 008](../../../doc/technique/decisions/008-bc-participation.md).

Participation porte les **projets** de la ville (F67), les **consultations** et demandes d’**avis non officiels** (F65, F66) avec les **contributions** des citoyens, et la **boîte à idées** (F68). Les soutiens de signalements et les inquiétudes (lot L14) restent dans Citizen.

Règles :

- Ports dans `Application/Ports/Provider` : `ParticipationAccessPolicy` et `DistrictDirectory` (implémentés par Administration, `Administration/Infrastructure/Adapter/Participation`), `ParticipantProvider` et `CitizenNotifier` (implémentés par Citizen, `Citizen/Infrastructure/Adapter/Participation`). Ne jamais importer une classe d’un autre BC, sauf dans l’adaptateur fournisseur `Infrastructure/Adapter/Citizen/ParticipationAccountDataEraser` (port `AccountDataEraser` de Citizen).
- F76 : avis sur les services (`ServiceReview`, table `participation_service_reviews`) ; le service évalué vient d’Administration par `ReviewedServiceDirectory` (`Administration/Infrastructure/Adapter/Participation/AdminParticipationServiceDirectory`).
- Les agents ne voient jamais l’identité des citoyens : vues `anonymousView()` / `followUpView()` sans `citizenId`. Le public ne voit que les éléments publiés, les résultats après clôture et les idées publiques.
- Toute mutation d’un agent est journalisée par `AuditTrail` (`participation.<ressource>.<verbe>`) dans la transaction du `command.bus`.
- Repositories sans `flush()` (transaction du `command.bus`). Pas d’événement de domaine ni de temps réel pour l’instant.
- Le contrat HTTP de la doc est consommé par le site (module `participation`) et l’admin (module `participation`) : le faire évoluer dans la doc d’abord.

Tests : aucune suite pour l’instant (décision d’économie du chantier) ; en ajouter une `Participation` dans `phpunit.dist.xml` au premier test.
