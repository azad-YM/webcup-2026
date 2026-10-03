# Agent backend Shared

Lire d’abord [la documentation locale](doc/README.md), puis les règles et cas d’usage pertinents avant toute modification. Mettre à jour cette source dans le même changement que le comportement. Pour un contrat externe, suivre le lien vers la documentation du propriétaire ; ne pas dupliquer ses règles ici.

Socle transverse aux BC, pas propriétaire de règles métier. Contient les primitives réellement communes et le kernel Symfony. Ne dépend d’aucun BC dans son code de production.

Un besoin d’un seul consommateur reste dans son port applicatif. Une implémentation d’un port fourni par un BC reste dans l’infrastructure de ce BC ; Shared ne devient pas un annuaire de services métiers ou de repositories.

Exception de composition réservée aux tests : `Tests/Fixtures`, `Doubles`, `Helpers` et `Suites` peuvent assembler plusieurs BC. Le socle `ApplicationTestCase`, la factory MySQL Testcontainers et les clés JWT temporaires résident dans `Tests/Infrastructure`.

Préserver : base éphémère par processus, remise à zéro avant chaque test applicatif, refus d’une base non gérée, arrêt du conteneur, absence de Docker dans les tests unitaires, aucun secret de production. Une modification de ce socle nécessite les suites des BC consommateurs, généralement `php bin/phpunit` depuis `api/`.

Pour toute nouvelle commande, suivre le workflow et le style de tests définis dans `api/AGENTS.md` : contrôleur AppController + MapRequestPayload + dispatch, handler via ports, test unitaire avec doubles puis test HTTP avec Doctrine/Testcontainers.
