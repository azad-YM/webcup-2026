# Agent backend Assistance

Lire d’abord [la documentation locale](doc/README.md) et l’[ADR 011](../../../doc/technique/decisions/011-bc-assistance.md).

Assistance oriente les habitants (L22) : recherche tolérante dans le catalogue (D10), assistant d’orientation (F91, F92), explication simple d’un passage (F90), brouillons « En clair » pour les agents (F89). Le BC n’a **aucune table** et ne possède aucun contenu.

Règles :

- Le catalogue se lit uniquement par le port `Application/Ports/Provider/ServiceCatalog` (adaptateur dans `Administration/Infrastructure/Adapter/Assistance`). Ne jamais importer une classe d’Administration ou de Communication dans `Application` ou `Domain`.
- Le modèle de langage passe par `Application/Service/AssistantModel` (port Shared `LanguageModel`). Toute fonctionnalité garde un repli local et renvoie `source: model|local`. Ne pas modifier le port Shared.
- Garde-fous à préserver : `Domain/Language/EmergencyDetector` avant tout appel au modèle ; identifiants de services du modèle filtrés par `AssistantModel::knownIds` ; pas de donnée d’identité dans les prompts ; rien n’est stocké.
- Routes POST nommées `assistance_*` : limitées dans `config/packages/security_hardening.yaml`. Une nouvelle route qui appelle le modèle y ajoute sa règle.
- Adaptateurs fournis : `Infrastructure/Adapter/Administration/AssistancePlainLanguageDrafter`, `Infrastructure/Adapter/Communication/AssistancePublicationPlainLanguageDrafter`.

Pas de suite PHPUnit (décision d’économie du chantier).
