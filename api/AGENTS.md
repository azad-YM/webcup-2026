# Backend Symfony

## Structure

BC : `IAM` (comptes et sessions), `Administration` (membres, rôles, permissions de la ville), `Citizen` (citoyens : inscription et profil livrés ; demandes à venir), `Pilotage` (flux de l’API du concours pour les agents). `Shared` est le socle transversal. Un BC peut être découpé en sous-domaines (SD) lorsqu’il grossit ; les règles ci-dessous s’appliquent alors aussi entre SD.

Chaque BC simple ou SD porte `Application`, `Domain`, `Infrastructure`, `Tests` et `doc`. Lire son `doc/README.md` avant de modifier ses règles ; les décisions transverses restent dans la documentation centrale. Les namespaces suivent le chemin sous `src`.

- Domain : règles métier et agrégats ; ne pas ajouter de dépendance au framework. Les interfaces Symfony de l’entité IAM héritée sont une dette existante, pas une convention à reproduire.
- Application : commandes, queries, handlers, DTO et ports. Les contrôleurs existants sont ici ; rester cohérent avec le module.
- Infrastructure : adaptateurs et persistance du module propriétaire, sans sous-dossiers ForProduction ou ForTests. Les doubles sont dans Tests/Doubles ; fixtures, helpers et socle de tests restent sous Tests.
- Composer, routes, services, mappings Doctrine et migrations doivent correspondre aux namespaces réellement livrés.

## Workflow par défaut d’une commande

Appliquer ce parcours à tout nouveau cas d’usage de mutation : test unitaire du comportement → commande et handler → test applicatif HTTP avec persistance réelle. Prendre `Administration` comme exemple de parcours et de tests : `AddMember` (port de création de compte vers IAM, événement de domaine) et `CreateRole` (politique d’autorisation locale).

- Placer `<Action>Command` et `<Action>Handler` dans `Application/Command/<Action>`. La commande porte les entrées typées et les contraintes de validation du payload. Le handler invocable porte `#[AsMessageHandler]`, orchestre les règles et utilise des ports injectés, sans connaître HTTP.
- Le contrôleur étend `Shared\Application\Lib\AppController`. Déclarer une route au format JSON ; recevoir `#[MapRequestPayload] <Action>Command $cmd`, puis retourner `$this->dispatch($cmd)`. Ne pas décoder manuellement le JSON, reconstruire la commande ou injecter/appeler directement le handler depuis le contrôleur.
- Garder la réponse et la traduction des erreurs dans le mécanisme commun. Le dispatch actuel retourne 200 en cas de succès ; ne pas imposer systématiquement 201 aux créations. Tester le contrat HTTP réellement retenu. Ne pas ajouter de gestion d’erreurs spécifique à chaque contrôleur.
- La validation de forme appartient au payload ; les règles métier restent vérifiées dans le cas d’usage et le domaine. Vérifier toutes les conditions avant sauvegarde : une entrée invalide doit refuser toute la mutation, sans persistance partielle. Un catalogue connu ne remplace pas l’autorisation de l’acteur ni son droit de délégation.
- Injecter les sources variables derrière leurs ports : repository, catalogue de permissions, générateur d’identifiants, horloge selon le besoin. Ne pas importer une infrastructure concrète dans le handler.

### Événements des agrégats et transactions

Les aggregate roots sont responsables de leurs événements de domaine. Utiliser le trait `Shared\Domain\Model\AggregateRoot` et appeler `record()` dans la méthode métier qui produit le fait (par exemple `create()`), jamais lors de la reconstitution d’un agrégat existant. Le handler orchestre le cas d’usage ; il ne construit ni ne publie ces événements.

Le repository persiste l’agrégat, récupère ses événements avec `pullDomainEvents()` et les dispatch sur `event.bus`. La récupération vide la pile : une seconde sauvegarde sans nouvelle mutation ne republie rien. Les nouveaux repositories utilisés par les commandes ne déclenchent pas leur propre `flush()` ; `command.bus` possède le middleware `doctrine_transaction`, responsable du flush final, du commit et du rollback. Un appel direct au handler ne bénéficie pas de cette transaction : les entrées de production doivent passer par le bus. Les adaptateurs intermodules exécutés dans le handler participent à la transaction courante.

Router l’interface `Shared\Domain\Event\DomainEvent` vers `async`. L’atomicité données/événements suppose le transport Doctrine sur la même connexion ; un broker externe exige un outbox. Les consommateurs doivent supporter les redélivrances du transport. Après un échec, rejouer la commande à partir d’agrégats rechargés, sans réutiliser une instance dont les événements ont été récupérés.

Dans les tests applicatifs d’événements, utiliser `InteractsWithMessenger`, le transport `test://` et `$this->transport('async')->queue()->assertContains(...)`. Vérifier aussi l’absence d’événement lors d’un refus et conserver des scénarios avec le vrai transport Doctrine pour la cohérence transactionnelle.

### Style des tests de commandes

Le test unitaire étend `TestCase`, avec `#[Group('Unit')]`. Dans `setUp()`, appeler le parent puis `bootHandler()`. Construire le handler avec un repository RAM, des stubs configurables et, si utile, `SequenceIdProvider`. Utiliser `makeCommand(array $override = [])` pour les entrées et `execute($command)` pour appeler le handler puis relire le résultat dans le repository. Vérifier l’état métier, les refus et l’absence de sauvegarde en cas d’échec ; éviter les mocks qui vérifient seulement l’ordre des appels. Le catalogue stub est indépendant du catalogue de production.

Le test applicatif étend `ApplicationTestCase`, avec `#[Group('Application')]`. Initialiser le kernel et la base isolée dans `setUp()`, charger les fixtures via `load()` et authentifier la fixture utilisateur sur le client. Employer un helper de requête avec payload par défaut et overrides. Passer par la vraie route, `MapRequestPayload`, Messenger, le catalogue de production et Doctrine. Relire le résultat après le `clear()` effectué par `request()`. Vérifier le statut HTTP, les données persistées et les refus pertinents, notamment permission inconnue, payload invalide et accès anonyme. Aucun repository RAM ni catalogue stub dans ce parcours HTTP.

Les doubles vivent dans `Tests/Doubles` du propriétaire ; partager les supports réutilisés dans le `Shared/Tests` approprié. Ne pas recréer `Infrastructure/ForProduction` ou `Infrastructure/ForTests`.

## Communication entre modules

Appliquer strictement la règle racine : port chez le consommateur, implémentation dans l’infrastructure du fournisseur, injection par Symfony. L’interface peut être rangée sous `Application/Ports/Provider` ou une catégorie qui décrit le besoin. Ce port n’est pas le repository du fournisseur.

Exemple livré :

```text
Administration/Application/Ports/Provider/MemberAccountProvisioner.php
IAM/Infrastructure/Adapter/Administration/IAMMemberAccountProvisioner.php
config/services.yaml : alias du port Administration vers cet adaptateur IAM
```

L’adaptateur implémente l’interface d’Administration et appelle le cas d’usage interne `CreateAccount` d’IAM. Administration n’importe aucune entité ni aucun handler d’IAM. Les erreurs et résultats doivent rester compréhensibles pour le consommateur. Les contrats traversant les BC ne transportent ni EntityManager ni entité Doctrine.

## Tests

- Tests dans `<module>/Tests/Suites/Unit` et `Application`. Doubles, Fixtures et Helpers locaux selon le besoin.
- Support partagé entre SD d’un même BC dans `<BC>/Shared/Tests` ; support partagé entre BC dans `Shared/Tests`.
- Namespaces `Tests\<BC>\<SD>\…` (ex. `Tests\IAM\…`, `Tests\Administration\…`), déclarés dans `autoload-dev`. Exclure Tests des services Symfony et de la couverture.
- Une suite PHPUnit par BC ; dossiers Application et Unit à l’intérieur. Chaque classe porte `#[Group('Unit')]` ou `#[Group('Application')]`.
- Unitaires : construire le handler avec des doubles Ram/Stub, sans kernel ni Docker. Tester les comportements métier.
- Applicatifs : étendre `Tests\Shared\Infrastructure\ApplicationTestCase`, appeler `parent::setUp()` puis `initialize()`, utiliser `load()` et `request()`. Employer les repositories Doctrine et le vrai firewall ; ne pas remplacer globalement les ports de persistance par des doubles.
- Pour un nouveau port intermodule : tester le consommateur avec un double et le raccordement réel avec l’adaptateur fournisseur.
- Garder MySQL 8.4 Testcontainers, l’isolation par processus et le contrôle avant destruction du schéma. Jamais de repli vers la base de développement. Les clés JWT des tests sont temporaires. Les tests par SchemaTool ne valident pas les migrations.

## Validation depuis api/

```bash
composer validate --no-check-publish
composer dump-autoload --no-scripts
php bin/phpunit --testsuite <BC> --group Unit
php bin/phpunit --testsuite <BC> --group Application
php bin/console lint:container --env=dev
```

Adapter les commandes au changement. Pour une modification de contrats transverses, exécuter les suites des deux côtés ; pour le socle de test, exécuter toutes les suites. Docker est requis pour Application. Ne pas appliquer de migration à une base persistante dans le cadre d’une simple vérification de tests.
