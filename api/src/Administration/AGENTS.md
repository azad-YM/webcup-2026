# Agent backend Administration

Lire d’abord [la documentation locale](doc/README.md), puis [membres et habilitations](doc/membres-et-habilitations.md). Mettre à jour cette source dans le même changement que le comportement.

Administration porte l’organisation municipale : membres de l’administration (agents, administrateurs), rôles, catalogue de permissions et accès à l’espace `admin`, ainsi que le catalogue des services municipaux (état, horaires des transports) et la liste fermée des quartiers (`Domain/VO/District`). Il ne gère ni mot de passe ni session : un membre référence un compte IAM par `userId`.

Règles :

- Compte connecté et création de compte passent par les ports `Application/Ports/Provider/CurrentAccountProvider` et `MemberAccountProvisioner`, implémentés par IAM dans `IAM/Infrastructure/Adapter/Administration`. Ne jamais importer une classe d’IAM dans le code applicatif ou de domaine.
- Pour autoriser un autre BC, implémenter **son** port dans `Infrastructure/Adapter/<BC>` (par exemple `Adapter/Citizen/…`, qui appellera `CheckCurrentMemberPermissions`), déclarer l’alias dans `services.yaml` et ajouter ses permissions au catalogue `InMemoryAdminPermissionRepository`.
- Adaptateurs livrés : `Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` (port `PilotageAccessPolicy` du BC [Pilotage](../Pilotage/doc/README.md), permission `admin.pilotage.read`) ; `Infrastructure/Adapter/Communication/AdminCommunicationAccessPolicy` (`admin.communication.write`) et `AdminCommunicationDistrictDirectory` pour [Communication](../Communication/doc/README.md) ; `Infrastructure/Adapter/Citizen/AdminCitizenDistrictDirectory` pour Citizen.
- L12/F50 : `Infrastructure/Adapter/Audit/AdminAuditAccessPolicy` (port `AuditAccessPolicy` du BC [Audit](../Audit/doc/README.md)) et `Infrastructure/Adapter/Pilotage/AdminPilotageActivity` (tableau de bord). Les handlers `CreateRole`, `AddMember` et `SaveMunicipalService` journalisent par le port Shared `AuditTrail` ([ADR 006](../../../doc/technique/decisions/006-journal-des-actions.md)).
- L18/L20 : `SetMunicipalServiceAvailability` (désactivation d’urgence, `admin.service.disable`, journal et topic public `public.services`) ; `Infrastructure/Adapter/Citizen/AdminSensitiveDataAccessPolicy` (port `SensitiveDataAccessPolicy` de Citizen, `admin.sensitive-data.read`, [ADR 007](../../../doc/technique/decisions/007-protection-des-donnees.md)). `MunicipalService` porte la désactivation (`disable`, `enable`) : modifications locales, l’agent N y ajoute la localisation.
- L’espace `admin` est fourni à IAM par `Infrastructure/Adapter/IAM/AdminAccessibleSpacesProvider` (tag `iam.accessible_spaces`).
- Vérifier toutes les conditions avant sauvegarde : un refus ne crée ni compte, ni membre, ni événement.

Exception : la CLI `Application/Cli/BootstrapAdminCommand` appelle `Infrastructure/Service/BootstrapAdminService`, qui compose directement l’entité IAM `User` avec `Role` et `Member` ([procédure](doc/initialisation-admin.md)). Ne pas étendre cette exception.

Tests : `php bin/phpunit --testsuite Administration`.
