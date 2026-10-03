# Agent backend IAM

Lire d’abord [la documentation locale](doc/README.md), puis [comptes et sessions](doc/comptes-et-sessions.md). Mettre à jour cette source dans le même changement que le comportement.

IAM répond uniquement à « qui se connecte ? » : comptes (e-mail, secret haché), login JWT, audiences, codes d’échange PKCE entre applications et agrégation des espaces accessibles. Il ne connaît ni membres, ni rôles, ni citoyens : ces profils appartiennent à [Administration](../Administration/doc/README.md) et à [Citizen](../Citizen/doc/README.md).

Règles :

- Pour servir un autre BC, implémenter **son** port dans `Infrastructure/Adapter/<BC>` (ex. `Adapter/Administration/IAMMemberAccountProvisioner`, qui appelle `CreateAccount`) et déclarer l’alias dans `services.yaml`. Traduire les erreurs d’IAM vers les erreurs contractuelles du consommateur.
- Un BC qui expose un espace implémente `AccessibleSpacesProvider` dans son infrastructure et l’étiquette `iam.accessible_spaces`.
- Ne jamais lire les tables ou repositories d’un autre BC.
- Vérifier toutes les conditions avant sauvegarde : un refus ne crée aucun compte.
- Préserver : aucun JWT dans une URL ; code de portail ≤ 60 s, à usage unique, lié à la destination, au challenge PKCE et à la session source ; audiences `site` et `admin` uniquement. Ajouter une application = ajouter sa destination (`IssuePortalCodeCommand`, `ExchangePortalCodeCommand`, `PortalAccessPolicy`) et son audience (`JwtAudienceListener`).
- Dettes connues : `User` implémente les interfaces Symfony ; `POST /api/auth/register` appelle son handler sans bus et reste protégé par le firewall. Ne pas reproduire.

Tests : `php bin/phpunit --testsuite IAM`.
