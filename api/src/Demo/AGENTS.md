# Agent backend Demo

Lire d’abord [la documentation locale](doc/README.md).

`Demo` n’est pas un BC : c’est une composition d’exploitation qui charge un jeu de données fictif (`app:demo:seed`) en jouant les cas d’usage publics des BC, exactement comme les écrans.

Règles (exception explicite des [consignes communes](../../../AGENTS.md#exception-de-composition-jeu-de-démonstration)) :

- N’importer des autres modules que leurs **commandes et queries applicatives** (`Application/Command/*/*Command`, `Application/Query/*/*Query`), envoyées sur `command.bus` / `query.bus` après validation. Jamais de handler, repository, entité, service concret, adaptateur ni SQL sur leurs tables.
- L’acteur est le compte réel : `actAs()` charge le compte par le fournisseur d’utilisateurs Symfony et place un jeton dans `TokenStorage`. Les autorisations, l’audit et les événements s’appliquent comme en HTTP.
- Chargement tout-ou-rien : une transaction DBAL englobe l’ensemble (les transactions du `command.bus` s’y imbriquent). Une erreur annule tout, messages Messenger compris.
- Aucun code de production ne dépend de `Demo`. Les textes vivent dans `DemoDataset` ; garder les identifiants de services stables.
- Mettre à jour [la documentation](doc/README.md) quand le jeu change.
