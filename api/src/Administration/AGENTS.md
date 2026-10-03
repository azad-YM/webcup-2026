# Agent backend Administration

Lire d’abord [la documentation locale](doc/README.md), puis [membres et habilitations](doc/membres-et-habilitations.md). Mettre à jour cette source dans le même changement que le comportement.

Administration porte l’organisation municipale : membres de l’administration (agents, administrateurs), rôles, catalogue de permissions et accès à l’espace `admin`, ainsi que le catalogue des services municipaux (état, horaires des transports) et la liste fermée des quartiers (`Domain/VO/District`). Il ne gère ni mot de passe ni session : un membre référence un compte IAM par `userId`.

Règles :

- Compte connecté et création de compte passent par les ports `Application/Ports/Provider/CurrentAccountProvider` et `MemberAccountProvisioner`, implémentés par IAM dans `IAM/Infrastructure/Adapter/Administration`. Ne jamais importer une classe d’IAM dans le code applicatif ou de domaine.
- Pour autoriser un autre BC, implémenter **son** port dans `Infrastructure/Adapter/<BC>` (par exemple `Adapter/Citizen/…`, qui appellera `CheckCurrentMemberPermissions`), déclarer l’alias dans `services.yaml` et ajouter ses permissions au catalogue `InMemoryAdminPermissionRepository`.
- Adaptateurs livrés : `Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy` (port `PilotageAccessPolicy` du BC [Pilotage](../Pilotage/doc/README.md), permission `admin.pilotage.read`) ; `Infrastructure/Adapter/Communication/AdminCommunicationAccessPolicy` (`admin.communication.write`) et `AdminCommunicationDistrictDirectory` pour [Communication](../Communication/doc/README.md) ; `Infrastructure/Adapter/Citizen/AdminCitizenDistrictDirectory` pour Citizen.
- L’espace `admin` est fourni à IAM par `Infrastructure/Adapter/IAM/AdminAccessibleSpacesProvider` (tag `iam.accessible_spaces`).
- Vérifier toutes les conditions avant sauvegarde : un refus ne crée ni compte, ni membre, ni événement.

Exception : la CLI `Application/Cli/BootstrapAdminCommand` appelle `Infrastructure/Service/BootstrapAdminService`, qui compose directement l’entité IAM `User` avec `Role` et `Member` ([procédure](doc/initialisation-admin.md)). Ne pas étendre cette exception.

Tests : `php bin/phpunit --testsuite Administration`.
