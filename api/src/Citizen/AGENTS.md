# Agent backend Citizen

Lire d’abord [la documentation locale](doc/README.md) et le [chantier](../../../doc/chantier/README.md).

Citizen porte la relation entre les habitants et la ville : inscription, profil citoyen, demandes et signalements, suivi de leur traitement. **Aucun code n’est encore livré.** Prendre `Administration` comme modèle de structure (commande + handler + port, `AddMember` pour la création de compte via un port, `CreateRole` pour une politique d’autorisation).

Règles :

- Un citoyen référence un compte IAM par `userId`. L’inscription est un cas d’usage de Citizen qui demande la création du compte à IAM via un port de Citizen implémenté dans `IAM/Infrastructure/Adapter/Citizen`, puis crée le citoyen dans la même transaction.
- Un compte créé par l’inscription est immédiatement citoyen : aucun statut de vérification.
- Le profil personnel est optionnel et modifiable plus tard ; aucune règle ne doit l’exiger pour utiliser la plateforme, sauf si une demande Webcup le justifie explicitement.
- Les droits des agents passent par un port de Citizen implémenté dans `Administration/Infrastructure/Adapter/Citizen`. Ne jamais lire les tables d’IAM ou d’Administration.
- Une demande ne référence un service que par son identifiant.
- Un citoyen ne voit que ses propres données ; l’identité vient toujours du compte connecté, jamais du payload.

À la création du BC, déclarer : autoload et autoload-dev (`Citizen\`, `Tests\Citizen\`), services (exclure `Tests`), routes, mapping Doctrine, suite PHPUnit `Citizen`, migration.

Tests : `php bin/phpunit --testsuite Citizen`.
