# Agent backend Citizen

Lire d’abord [la documentation locale](doc/README.md) et le [chantier](../../../doc/chantier/README.md).

Citizen porte la relation entre les habitants et la ville : inscription, profil citoyen, demandes et signalements, suivi de leur traitement. Livré : inscription publique (`RegisterCitizen`), lecture et mise à jour du profil (`GetMyCitizenProfile`, `UpdateMyCitizenProfile`) ; voir la section « Livré » de la doc. Les demandes (lot L2) restent à construire sur le même modèle ; `Administration` reste la référence pour une politique d’autorisation (`CreateRole`).

Règles :

- Un citoyen référence un compte IAM par `userId`. L’inscription est un cas d’usage de Citizen qui demande la création du compte à IAM via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis crée le citoyen dans la même transaction.
- Un compte créé par l’inscription est immédiatement citoyen : aucun statut de vérification.
- Le profil personnel est optionnel et modifiable plus tard ; aucune règle ne doit l’exiger pour utiliser la plateforme, sauf si une demande Webcup le justifie explicitement.
- Les droits des agents passent par un port de Citizen implémenté dans `Administration/Infrastructure/Adapter/Citizen`. Ne jamais lire les tables d’IAM ou d’Administration.
- Une demande ne référence un service que par son identifiant.
- Un citoyen ne voit que ses propres données ; l’identité vient toujours du compte connecté, jamais du payload.
- Le contrat HTTP de la doc est consommé par le site : toute évolution est faite dans la doc d’abord.
- Une erreur contractuelle qui doit produire `409` étend `Shared\Domain\Exception\ConflitException` (une `\DomainException` est traduite en `422` par `AppController`).

Câblage déclaré : autoload et autoload-dev (`Citizen\`, `Tests\Citizen\`), services (exclut `Tests`), alias des ports vers `IAM/Infrastructure/Adapter/Citizen`, routes, mapping Doctrine, règle `PUBLIC_ACCESS` de `POST /api/citizen/register` dans `security.yaml`, suite PHPUnit `Citizen`, migration `Version20261003001100`.

Tests : `php bin/phpunit --testsuite Citizen`.
