# Agent backend Citizen

Lire d’abord [la documentation locale](doc/README.md) et le [chantier](../../../doc/chantier/README.md).

Citizen porte la relation entre les habitants et la ville : inscription, profil citoyen, demandes et signalements, suivi de leur traitement. Livré : inscription publique (`RegisterCitizen`), lecture et mise à jour du profil (`GetMyCitizenProfile`, `UpdateMyCitizenProfile`), activation (`ActivateMyCitizenAccount`) ; demandes citoyennes du lot L2 (`SubmitServiceRequest`, `ListMyServiceRequests`, `GetMyServiceRequest`, `ListRequestQueue`, `ChangeRequestStatus`, projection temps réel `PublishServiceRequestRealtime`) ; voir les sections « Livré » de la doc. `Administration` reste la référence pour une politique d’autorisation (`CreateRole`).
Citizen porte la relation entre les habitants et la ville : inscription, profil citoyen, demandes et signalements, suivi de leur traitement. Livré : inscription publique (`RegisterCitizen`), lecture et mise à jour du profil (`GetMyCitizenProfile`, `UpdateMyCitizenProfile`, quartier validé par Administration), préférences d’alerte (`GetMyAlertPreference`, `SetMyAlertPreference` : consentement aux alertes sanitaires) ; voir la section « Livré » de la doc. Les demandes (lot L2) restent à construire sur le même modèle ; `Administration` reste la référence pour une politique d’autorisation (`CreateRole`).

Règles :

- Un citoyen référence un compte IAM par `userId`. L’inscription est un cas d’usage de Citizen qui demande la création du compte à IAM via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis crée le citoyen dans la même transaction.
- Un compte créé par l’inscription est immédiatement citoyen : aucun statut de vérification.
- Le profil personnel est optionnel et modifiable plus tard ; aucune règle ne doit l’exiger pour utiliser la plateforme, sauf si une demande Webcup le justifie explicitement.
- Les droits des agents passent par le port `RequestAccessPolicy` de Citizen, implémenté dans `Administration/Infrastructure/Adapter/Citizen`. Ne jamais lire les tables d’IAM ou d’Administration.
- Le temps réel est une projection : un handler applicatif écoute l’événement de domaine et publie via `RealtimePublisher` (identifiants et statut seulement). Jamais depuis l’entité.
- Une demande ne référence un service que par son identifiant.
- Compte et sécurité (L8) : suppression par anonymisation, suspension et liste des comptes pour les agents, règle du compte agent protégé — voir [compte et sécurité](doc/compte-et-securite.md). Les données citoyennes ajoutées plus tard s’effacent via un `AccountDataEraser` (tag `citizen.account_data_eraser`).
- Citizen fournit à Communication l’audience du citoyen connecté (`Infrastructure/Adapter/Communication/CitizenAudienceProvider`) et accorde les topics temps réel des alertes ciblées (`Infrastructure/Adapter/Shared/CitizenAlertRealtimeAudience`) ; ne jamais exposer de donnée de santé, seulement le consentement.
- Un citoyen ne voit que ses propres données ; l’identité vient toujours du compte connecté, jamais du payload.
- Le contrat HTTP de la doc est consommé par le site : toute évolution est faite dans la doc d’abord.
- Une erreur contractuelle qui doit produire `409` étend `Shared\Domain\Exception\ConflitException` (une `\DomainException` est traduite en `422` par `AppController`).

Livré aussi : notifications persistées (F49, [doc](doc/notifications.md)), rendez-vous et cron `app:appointments:remind` (L10, [doc](doc/rendez-vous.md)), participation — inquiétudes et soutien des signalements publics (L14, [doc](doc/participation.md)). Le catalogue des services est lu via le port `MunicipalServiceDirectory` (adaptateur `Administration/Infrastructure/Adapter/Citizen/AdminCitizenServiceDirectory`).

Câblage déclaré : autoload et autoload-dev (`Citizen\`, `Tests\Citizen\`), services (exclut `Tests`), alias des ports vers `IAM/Infrastructure/Adapter/Citizen`, routes, mapping Doctrine, règle `PUBLIC_ACCESS` de `POST /api/citizen/register` dans `security.yaml`, suite PHPUnit `Citizen`, migrations `Version20261003001100` (citoyens), `Version20261003002000` (demandes) et `Version20261003008000` (statut, L8), `Version20261003110000` (notifications), `Version20261003110100` (rendez-vous), `Version20261003110200` (soutiens), `Version20261003110300` (inquiétudes), alias `RequestAccessPolicy` dans `services.yaml`.

Tests : `php bin/phpunit --testsuite Citizen`.
