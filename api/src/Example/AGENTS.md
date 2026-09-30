# Agent backend Example

Lire d’abord [la documentation locale](doc/README.md).

BC fictif servant de modèle : une entité `Item` avec CRUD complet, un événement de domaine, un port d’autorisation fourni par IAM et des tests unitaires + HTTP. Pour démarrer un nouveau domaine, dupliquer ce BC (namespaces, routes, mapping, table, suite PHPUnit, autoload) plutôt que d’y ajouter du métier réel.

- Ne jamais importer de classe d’IAM : l’autorisation passe par `Application/Ports/Provider/ItemAccessPolicy`.
- Le handler vérifie l’accès en premier, puis toutes les règles, avant `save()`.
- Le repository Doctrine ne flush pas (middleware `doctrine_transaction`) et publie les événements via `pullDomainEvents()`.

Tests : `php bin/phpunit --testsuite Example`.
