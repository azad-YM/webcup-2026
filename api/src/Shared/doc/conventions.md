# Conventions techniques

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Shared](README.md) › Conventions techniques
<!-- navigation:end -->


## Nommage et langue

- le code, les identifiants et les messages techniques sont rédigés en anglais ;
- la documentation métier et les libellés destinés aux utilisateurs sont rédigés en français ;
- les contextes PHP utilisent `PascalCase` et les fichiers TypeScript `kebab-case` ;
- un port décrit une capacité attendue, un adaptateur précise la technologie employée.

Le vocabulaire du glossaire de chaque BC (dans son dossier `doc`) doit être utilisé de manière cohérente dans le code et la documentation.

## Dépendances

- le domaine ne dépend d'aucun framework ;
- l'application dépend du domaine et définit les interfaces qu'elle consomme ;
- l'infrastructure implémente les ports applicatifs ;
- l'UI orchestre l'affichage et ne porte pas de règle métier durable ;
- les échanges entre contextes passent par des contrats explicites.

## Événements de domaine et bus

Les aggregate roots utilisent le trait `Shared\Domain\Model\AggregateRoot`. Une méthode métier enregistre le fait avec `record()` ; le constructeur de reconstitution ne produit pas d’événement. Le repository appelle `persist()`, puis dispatch les événements retournés par `pullDomainEvents()` sur `event.bus`. La pile est vidée après récupération. Les handlers ne construisent ni ne dispatchent les événements des agrégats.

Les commandes passent par `command.bus`, muni de `doctrine_transaction`. Le middleware ouvre la transaction avant le handler, effectue le `flush()` final et valide ou annule l’ensemble. Les nouveaux repositories participant à ce parcours laissent le flush au middleware. Certains repositories historiques conservent leur flush pour leurs appels directs existants ; ce flush ne constitue pas un commit de la transaction englobante. Les queries utilisent `query.bus`, sans middleware transactionnel ; `event.bus` accepte l’absence de handler.

Le routage de l’interface `Shared\Domain\Event\DomainEvent` vers `async` couvre les événements des différents modules. Avec le transport Doctrine sur la même connexion que les entités, l’insertion en file est annulée si le flush final échoue. Avec un transport externe, cette garantie nécessite un outbox. La livraison peut être répétée : les futurs subscribers doivent être idempotents. Une reprise recharge les agrégats et rejoue la commande, sans réutiliser une instance dont les événements ont déjà été récupérés.

Les tests HTTP d’événements utilisent `Zenstruck\Messenger\Test\InteractsWithMessenger` et `test://`, avec des assertions sur `transport('async')->queue()`. Les tests unitaires vérifient les événements de l’agrégat et le vidage de la pile. Les tests avec Doctrine réel vérifient séparément la cohérence de la transaction et de la file.

## Tests

- tester les règles métier au niveau unitaire le plus bas pertinent ;
- utiliser des adaptateurs en mémoire pour isoler les cas d'usage ;
- réserver les tests d'intégration aux assemblages Symfony, Doctrine, HTTP et services externes ;
- ajouter un test de non-régression pour chaque correction de bug ;
- exprimer les scénarios métier avec le vocabulaire du domaine.

## API et données

Le listener commun `ExceptionListener` est enregistré sur `kernel.exception`. Il traduit notamment les refus d’accès applicatifs (y compris enveloppés par Messenger) en 403 et préserve le statut HTTP de validation du payload, notamment 422. Une erreur non reconnue conserve un statut 500.

- valider les entrées aux frontières du système ;
- ne pas exposer directement les entités de persistence dans les contrats HTTP ;
- traiter explicitement les montants, devises, dates, périodes et fuseaux horaires ;
- tracer les opérations sensibles sans enregistrer de secrets ni de données personnelles inutiles ;
- prévoir l'idempotence pour les opérations financières ou soumises à reprise.

## Configuration et secrets

- versionner uniquement des fichiers `.env.example` sans secret ;
- ne jamais versionner clés JWT, tokens, mots de passe ou certificats ;
- générer puis versionner les lockfiles pour garantir des builds reproductibles ;
- documenter toute nouvelle variable d'environnement.

## Documentation

- documenter l'intention, les contraintes et les décisions plutôt que le code ligne par ligne ;
- mettre à jour chemins, commandes et schémas lorsqu'une application évolue ;
- créer une décision d'architecture pour tout choix structurant ou difficilement réversible.

<!-- backlinks:start -->
---

[← Retour à Shared](README.md)
<!-- backlinks:end -->
