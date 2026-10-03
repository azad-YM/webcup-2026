# Documentation — Shared

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Shared
<!-- navigation:end -->


Shared est le socle technique commun aux BC, pas un domaine métier destiné à un utilisateur final. Il accueille les primitives réellement communes, l’infrastructure partagée et le support de tests utilisé entre plusieurs BC.

Il ne centralise ni leurs entités ni leurs règles, et ne sert pas de raccourci pour appeler leurs repositories. Les parcours transverses présents ici sont des scénarios de composition et de recette.

**État actuel :** kernel, `AppController`, `ExceptionListener`, exceptions de domaine, `AggregateRoot`, ports `IClock` / `IIdProvider` et support de tests Symfony/Testcontainers. Le modèle `Role`, autrefois placé ici, appartient désormais à [Administration](../../Administration/doc/README.md).

## Support et conventions

- [Capacités transverses à cadrer](capacites-transverses.md)
- [Conventions techniques](conventions.md)
- [Environnements et exploitation](environnements.md)
- [Format des cas d’usage](rediger-un-cas-usage.md)

## Architecture commune

[Architecture](../../../../doc/technique/architecture.md) · [Frontières et accès inter-BC](../../../../doc/technique/decisions/002-frontieres-et-acces.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Architecture transverse](../../../../doc/technique/README.md)
<!-- backlinks:end -->
