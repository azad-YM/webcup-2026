# ADR 001 — Utiliser MySQL

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 001 — Utiliser MySQL
<!-- navigation:end -->


- Statut : accepté
- Date : 2026-07-14

## Contexte

Le boilerplate initial utilisait PostgreSQL 15 ; les projets cibles de ce socle retiennent MySQL.

## Décision

Le boilerplate utilise MySQL 8.4 comme système de gestion de base de données relationnelle. Les connexions applicatives utilisent Doctrine DBAL avec le pilote `pdo_mysql` et l'encodage `utf8mb4`.

## Conséquences

- les environnements Docker utilisent l'image `mysql:8.4` et le port standard `3306` ;
- les migrations et requêtes doivent être compatibles avec MySQL 8.4 ;
- les environnements déployés doivent fournir les variables `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` et `MYSQL_ROOT_PASSWORD` ;
- le changement de moteur ne nécessite pas de migration de données, le projet étant encore au stade du boilerplate.

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)
<!-- backlinks:end -->
