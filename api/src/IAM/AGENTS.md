# Agent backend IAM

Lire d’abord [la documentation locale](doc/README.md), puis [comptes et sessions](doc/comptes-et-sessions.md) ou [membres et habilitations](doc/membres-et-habilitations.md). Mettre à jour cette source dans le même changement que le comportement.

IAM est un BC au même niveau qu’`Example`. Il répond à « qui se connecte ? » et « qui peut faire quoi ? » :

- identité : comptes, e-mail, secret haché, login JWT, audiences, codes d’échange PKCE entre applications ;
- accès : membres d’administration, rôles, catalogue de permissions (`InMemoryAdminPermissionRepository`), espaces accessibles ;
- politiques d’accès fournies aux autres BC.

Règles :

- Pour servir un autre BC, implémenter **son** port dans `Infrastructure/Adapter/<BC>` (ex. `Adapter/Example/AdminItemAccessPolicy`, qui appelle `CheckCurrentMemberPermissions`), déclarer l’alias dans `services.yaml` et ajouter ses permissions au catalogue.
- Un BC qui expose son propre espace implémente `AccessibleSpacesProvider` dans son infrastructure et l’étiquette `iam.accessible_spaces`.
- Ne jamais lire les tables ou repositories d’un autre BC.
- Vérifier toutes les conditions avant sauvegarde : un refus ne crée ni compte, ni membre, ni événement.
- Préserver : aucun JWT dans une URL ; code de portail ≤ 60 s, à usage unique, lié à la destination, au challenge PKCE et à la session source ; audiences `site` et `admin` uniquement. Ajouter une application = ajouter sa destination (`IssuePortalCodeCommand`, `ExchangePortalCodeCommand`, `PortalAccessPolicy`) et son audience (`JwtAudienceListener`).
- Dettes connues : `User` implémente les interfaces Symfony ; `Role` réside dans le Shared global. Ne pas reproduire.

Exception : la CLI `Application/Cli/BootstrapAdminCommand` appelle directement le service Shared d’initialisation ([procédure](../Shared/doc/initialisation-admin.md)).

Tests : `php bin/phpunit --testsuite IAM`.
