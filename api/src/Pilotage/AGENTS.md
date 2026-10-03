# Agent backend Pilotage

Lire d’abord [la documentation locale](doc/README.md). Mettre à jour cette source dans le même changement que le comportement.

Pilotage met à disposition des agents le flux de l’API du concours Webcup (les besoins de la ville, vague par vague). Il ne stocke rien : pas d’entité Doctrine ni de migration.

Règles :

- L’API du concours n’est lue que par le port `Application/Ports/Gateway/WebcupFeedGateway`, implémenté par `Infrastructure/Http/WebcupHttpFeedGateway` (`symfony/http-client`, pool de cache `pilotage.webcup_feed.cache`, 20 s). Les erreurs ne sont jamais mises en cache.
- La clé `WEBCUP_API_KEY` n’est envoyée que dans l’en-tête `X-Webcup-Api-Key`. Ne jamais la mettre dans une URL, un message d’erreur, un log, une réponse ou un fichier versionné ; la vraie clé vit dans `api/.env.local`.
- L’autorisation passe par le port `Application/Ports/Provider/PilotageAccessPolicy`, implémenté par Administration (`Administration/Infrastructure/Adapter/Pilotage/AdminPilotageAccessPolicy`, permission `admin.pilotage.read`). Ne jamais importer une classe d’Administration ou d’IAM dans Pilotage.
- Erreurs contractuelles dans `Application/Exception` (`ApiException` de Shared) : clé absente → 503, clé refusée → 502, panne ou réponse illisible → 502.

Tests : `php bin/phpunit --testsuite Pilotage`. Aucun appel réseau : en environnement `test`, le client HTTP de Symfony est un `MockHttpClient` alimenté par `Tests/Doubles/Http/WebcupApiSimulator` (`config/packages/test/pilotage.yaml`).
