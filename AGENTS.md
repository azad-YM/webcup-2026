# Nova Terra — consignes communes

## Avant de modifier

Lire les `AGENTS.md` des répertoires parents et du périmètre modifié, y compris ceux des modules fournisseurs si une intégration les touche. Depuis la racine, lire explicitement les fichiers locaux des cibles avant de travailler. Les consignes locales précisent celles-ci ; elles ne lèvent pas les frontières architecturales.

Consulter `doc/contexte/README.md` et `doc/chantier/README.md` pour le produit et l’avancement, `doc/technique/architecture.md`, puis le `doc/README.md` du BC ou sous-domaine concerné et les pages qu’il référence. Pour le frontend, lire aussi le `doc/README.md` de l’application, qui pointe vers les sources métier. Distinguer les décisions retenues, le code livré et les fonctionnalités encore à construire. Préserver les modifications utilisateur et limiter le changement au besoin demandé.

## Frontières obligatoires entre BC et sous-domaines

Aucun BC/SD consommateur ne doit appeler directement les détails internes d’un autre BC/SD. Cette règle s’applique aussi aux sous-domaines d’un même BC.

1. Le consommateur définit le port dont son cas d’usage a besoin dans sa couche Application, avec ses DTO et ses erreurs contractuelles.
2. Le fournisseur implémente ce port dans **sa propre Infrastructure**. L’adaptateur traduit vers ses propres cas d’usage et traduit le résultat vers le contrat du consommateur.
3. La composition injecte l’adaptateur derrière le port. Le consommateur ne connaît ni la classe concrète ni les entités du fournisseur.

Seuls l’adaptateur fournisseur (import du port et de ses types contractuels) et la configuration de composition peuvent faire ce raccordement entre modules. Ne pas importer un handler, repository, entité, service concret ou modèle ORM étranger dans le code consommateur. Pas de SQL sur les tables d’un autre module, d’association ORM entre leurs agrégats, de service locator ou d’accès indirect via un singleton pour contourner le port. Utiliser des identifiants et des DTO contractuels aux frontières.

Les primitives réellement communes de `Shared` sont utilisables dans leur portée. Ne pas déplacer un modèle métier dans Shared pour contourner son propriétaire. Le Shared global ne dépend pas d’un BC. Le support et les scénarios de test transverses peuvent assembler les modules sans devenir des dépendances de production.

### Exception d’initialisation CLI

La CLI `Administration/Application/Cli/BootstrapAdminCommand` appelle directement
`Administration/Infrastructure/Service/BootstrapAdminService`. Cette exception explicite
assemble l’entité compte IAM avec le rôle et le membre d’Administration pour
l’initialisation technique, dans une transaction, sans handler ni bus applicatif.
Elle ne s’étend pas aux workflows HTTP ni aux autres services. Voir la
[procédure d’initialisation](api/src/Administration/doc/initialisation-admin.md).

## Périmètres

- Backend : `api/AGENTS.md`, puis `api/src/<BC>/AGENTS.md` (`IAM`, `Administration`, `Citizen`, `Communication`, `Pilotage`, `Shared`).
- Frontend : `front/AGENTS.md`, puis `front/apps/<application>/AGENTS.md` (`site`, `admin`).
- Packages frontend partagés : `front/packages/AGENTS.md`.

Les profils sont des instructions de travail par répertoire ; ils ne démarrent pas automatiquement plusieurs agents. Pour une tâche transversale, décrire le port et ses types, identifier le consommateur et le fournisseur, puis réaliser les modifications nécessaires des deux côtés et le câblage.

## Livraison

Exécuter les vérifications adaptées aux fichiers touchés. Rapporter ce qui fonctionne, les limites réelles et les validations effectuées. Ne pas présenter les gateways locales ou en attente comme une intégration IAM livrée. Ne pas inclure les sorties de build, caches, clés ou secrets dans les changements source. Actualiser les contrats et la documentation lorsqu’ils évoluent, ainsi que le statut des demandes dans `doc/chantier`.

## Propriété de la documentation

Chaque BC et SD porte son dossier `doc`. Les règles métier, use cases, acteurs, glossaires et décisions locales y font autorité. La documentation centrale `doc` contient seulement l’architecture et les décisions transverses, avec un index de liens. Ne pas recréer un catalogue métier central ni dupliquer une règle dans la documentation d’un consommateur. Mettre à jour les docs et les liens des agents lorsqu’un propriétaire ou contrat change.

Chaque document porte un fil d’Ariane sous son titre et un lien de retour vers son index parent. Pour les liens transverses, maintenir une section « Référencé depuis » permettant de revenir aux documents appelants. Utiliser des liens Markdown relatifs, vérifier les cibles et actualiser ces retours lors d’un déplacement ou d’un nouveau lien. Les blocs `navigation` et `backlinks` délimitent ces éléments sans modifier le contenu métier.

Les index locaux doivent être compréhensibles sans lire les règles en premier : côté application, expliquer le contexte produit, les utilisateurs, les objectifs et les parcours ; côté BC/SD, expliquer la mission, les responsabilités et les consommateurs avant les user stories, contrats et règles. Séparer explicitement le livré, la cible retenue et les questions ouvertes. Relier les parcours frontend aux cas d’usage backend dans les deux sens. Les Shared documentent leurs consommateurs techniques plutôt que des utilisateurs métier fictifs.
