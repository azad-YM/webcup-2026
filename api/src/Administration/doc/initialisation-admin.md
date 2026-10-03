# Initialisation de l’administrateur principal

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Administration](README.md) › Initialisation de l’administrateur
<!-- navigation:end -->

Ce parcours d’exploitation crée les données nécessaires pour ouvrir l’admin. Son consommateur est la CLI `Administration/Application/Cli/BootstrapAdminCommand`, qui appelle directement `Administration/Infrastructure/Service/BootstrapAdminService`, sans commande applicative, handler ni Messenger.

## Exécution

Depuis `api/` :

```sh
php bin/console app:admin:bootstrap
```

Avec Docker :

```sh
docker compose -f docker/compose.dev.yaml exec api php bin/console app:admin:bootstrap
```

Valeurs par défaut : `admin@example.com` / `password`, modifiables par `--email` et `--password`. Le mot de passe est haché et jamais affiché. **Changer ces valeurs hors développement.**

## Effets et exception architecturale

Dans une transaction Doctrine : le rôle `principal-administrator` (« Administrateur principal ») reçoit toutes les permissions du catalogue d’Administration ; le compte IAM (`User`) est créé s’il n’existe pas ; un membre actif le rattache à ce rôle.

C’est l’unique exception de composition directe entre modules : le service d’Administration lit et persiste l’entité IAM `User` sans passer par un port, et ne publie pas `MemberCreated`. Les [règles ordinaires des membres](membres-et-habilitations.md) s’appliquent à tout autre parcours.

Une nouvelle exécution resynchronise les permissions du rôle sans doublon et sans remplacer le mot de passe. Un compte rattaché à un autre membre ou à un membre inactif est refusé, sans changement partiel.

## Validation et limites

`Administration/Tests/Suites/Application/BootstrapAdminTest` passe par la vraie CLI, Doctrine et MySQL éphémère : répétition, mot de passe préservé, connexion et accès à l’espace `admin`. Le schéma doit exister avant l’exécution ; la commande n’est exposée par aucune route HTTP.

<!-- backlinks:start -->
---
[← Retour à Administration](README.md)

**Référencé depuis :**

- [Consignes communes](../../../../AGENTS.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [Consignes Administration](../AGENTS.md)
- [Membres et habilitations](membres-et-habilitations.md)
- [Administration](README.md)
<!-- backlinks:end -->
