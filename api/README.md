# API

API Symfony de la plateforme Nova Terra, organisée en bounded contexts (BC) et sous-domaines (SD). Chaque module possède ses couches, ses tests et sa documentation.

Consignes de travail : [agent backend](AGENTS.md), puis le `AGENTS.md` du BC et du sous-domaine concernés. Les échanges entre modules passent par un port du consommateur implémenté dans l’infrastructure du fournisseur.

## Organisation

```text
src/
├── IAM/                       # BC identité : comptes, login JWT, codes PKCE, espaces accessibles
├── Administration/            # BC organisation municipale : membres, rôles, permissions (+ services, publications à venir)
├── Citizen/                   # BC citoyens et demandes : documentation seule, code à créer
└── Shared/                    # kernel, AppController, exceptions, AggregateRoot, ports techniques
```

- `Domain` porte les entités et règles métier.
- `Application` orchestre les cas d’usage (commandes, queries, handlers, contrôleurs) et définit les ports.
- `Infrastructure` contient les adaptateurs Doctrine, sécurité et intermodules.
- `Tests/Doubles` contient les implémentations en mémoire, jamais injectées dans les tests HTTP.

Documentation : [index central](../doc/README.md), [IAM](src/IAM/doc/README.md), [Administration](src/Administration/doc/README.md), [Citizen](src/Citizen/doc/README.md), [Shared](src/Shared/doc/README.md).

## Endpoints livrés

| Méthode | Route | Module |
|---|---|---|
| POST | `/api/login_check` | IAM |
| POST | `/api/auth/register` | IAM (inscription historique) |
| GET | `/api/iam/me`, `/api/iam/me/spaces` | IAM |
| POST | `/api/iam/portal-codes`, `/api/iam/portal-sessions` | IAM |
| GET | `/api/administration/permissions` | Administration |
| POST | `/api/administration/roles`, `/api/administration/members` | Administration |

CLI : `php bin/console app:admin:bootstrap` ([procédure](src/Administration/doc/initialisation-admin.md)).

## Tests

```text
<Module>/Tests/
├── Doubles/{Repository,Provider,Service}/
├── Fixtures/
└── Suites/
    ├── Unit/{Command,Entity,Query}/
    └── Application/
```

Le socle global est dans `src/Shared/Tests` :

- `Infrastructure/ApplicationTestCase.php` : client Symfony, schéma neuf, fixtures et requêtes JSON ;
- `Infrastructure/TestConnectionFactory.php` : base MySQL 8.4 Testcontainers par processus ;
- `Infrastructure/TestJwtKeys.php` : clés RSA temporaires ;
- `Fixtures/UserFixture.php` : compte de test avec authentification JWT réelle ;
- `Doubles/Service/SequenceIdProvider.php` : identifiants déterministes.

Namespaces `Tests\IAM\…`, `Tests\Administration\…`, `Tests\Shared\…`, chargés uniquement par `autoload-dev`. Suites PHPUnit par BC (`IAM`, `Administration`, `Shared`) ; groupes `Unit` et `Application`.

```bash
php bin/phpunit --group Unit                       # sans Docker
php bin/phpunit --testsuite Administration
php bin/phpunit --testsuite IAM --group Application
php bin/phpunit                                     # tout (Docker requis)
```

Les tests applicatifs exigent Docker accessible depuis PHP, `pdo_mysql` et OpenSSL. Le premier lancement télécharge `mysql:8.4`. `initialize()` recrée le schéma depuis les mappings avant chaque test ; ces tests ne valident donc pas les migrations. Aucune base configurée dans `.env` n’est utilisée.

Exemples de référence : `Administration/Tests/Suites/Unit/Command/AddMemberTest.php` (unitaire, port de création de compte doublé) et `Administration/Tests/Suites/Application/AddMemberTest.php` (HTTP + Doctrine + événement + adaptateur IAM réel).

## Ajouter un module

1. Créer `src/<Module>` avec `Application`, `Domain`, `Infrastructure`, `Tests`, `doc` et `AGENTS.md`, sur le modèle d’`Administration`.
2. Déclarer l’autoload (`autoload` et `autoload-dev`) dans `composer.json`, puis `composer dump-autoload`.
3. Déclarer la suite dans `phpunit.dist.xml` et exclure ses `Tests` de la couverture.
4. Déclarer les services (en excluant `Tests`), les routes, le mapping Doctrine et les alias des ports vers les adaptateurs de production.
5. Si le module délègue son autorisation à Administration, définir son port d’accès et l’implémenter dans `Administration/Infrastructure/Adapter/<Module>` ; ajouter ses permissions au catalogue `InMemoryAdminPermissionRepository`. S’il crée des comptes, définir son port de création et l’implémenter dans `IAM/Infrastructure/Adapter/<Module>`.
6. Générer la migration : `php bin/console doctrine:migrations:diff`.

## Configuration locale

MySQL 8.4, `utf8mb4`, pilote `pdo_mysql`.

```bash
cp .env.example .env
composer install
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate -n
php bin/console app:admin:bootstrap
```

L’hôte Docker de la base est `db`. Pour PHP sur l’hôte, adapter `DATABASE_URL` au port publié. Ne jamais versionner secrets ni clés JWT.

<!-- backlinks:start -->
---

[← Retour à l’accueil du projet](../README.md)
<!-- backlinks:end -->
