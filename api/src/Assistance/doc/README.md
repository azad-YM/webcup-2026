# Assistance — orientation des habitants

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Assistance
<!-- navigation:end -->

## Mission

Aider un habitant à trouver le bon service ou la bonne démarche, même quand sa demande est mal formulée, et rendre les textes administratifs plus faciles à comprendre. Assistance **lit** le catalogue des services (propriétaire : [Administration](../../Administration/doc/README.md)) et **propose** des textes ; elle ne stocke rien. Décision : [ADR 011](../../../../doc/technique/decisions/011-bc-assistance.md).

Consommateurs : le [site](../../../../front/apps/site/doc/assistance.md) (recherche des services, assistant, « Expliquer simplement »), Administration et Communication (brouillon « En clair » pour l’admin).

## Livré (L22 — non testé, non vérifié dans un navigateur)

| Demande | Ce qui est livré | Sans clé (repli local) |
|---|---|---|
| D10 | `GET /api/assistance/services/search?q=&lang=` : classement tolérant (accents, pluriels, fautes de frappe corrigées vers un mot connu → `suggestion` « Vous vouliez dire… », mots du quotidien : papiers, bébé, poubelles, bus, malade… en fr/en/ar). `POST /api/assistance/services/search` `{query, language}` : le modèle reformule (`reformulation`) et choisit au plus 3 services du catalogue, placés en tête. | Classement local seul (`source: local`) |
| F91, F92 | `POST /api/assistance/orientation` `{messages: [{role, text}] (1 à 8), language}` → `{reply, question, suggestions, actions (≤ 3), urgent, emergencyNumbers, source, modelAvailable}`. Actions : fiche service, demande préremplie (`/espace/demandes/nouvelle?service=…`, `type=report` pour un problème), rendez-vous, appel 15/17/18/112, `/urgences`, `/bienvenue`, `/participer`. | Moteur D10 + intention par règles (signaler, demander, rendez-vous, s’informer) + questions de précision (thèmes, choix entre deux services), phrases fr/en/ar |
| F90 | `POST /api/assistance/explanations` `{text ≤ 2000, language}` → `{explanation, terms, source}` | `terms` : mots administratifs difficiles du lexique (`PlainLexicon`) ; le site ajoute son glossaire et la version « En clair » validée |
| F89 | Brouillon « En clair » via les ports `PlainLanguageDrafter` d’Administration et de Communication (`PlainLanguageWriter`) | Premières phrases du résumé, mots difficiles expliqués entre parenthèses |

Garde-fous : urgence vitale ou danger détectés par règles avant tout appel au modèle (`EmergencyDetector`) ; réponse du modèle en JSON, identifiants de services validés contre le catalogue (`AssistantModel::knownIds`) ; l’assistant se présente comme automatique (texte du site) ; aucun nom, adresse ou numéro demandé ; conversation non stockée, seuls les 8 derniers messages sont envoyés ; limites par IP : recherche assistée 40, orientation 30, explications 40 requêtes par 10 minutes.

## Structure

- `Domain/Language` : `TextFolding` (normalisation, pluriels, tolérance aux fautes), `EverydayVocabulary` (mots du quotidien → mots du catalogue), `EmergencyDetector`, `PlainLexicon`.
- `Application/Service` : `ServiceFinder`, `AssistantModel` (accès au port `LanguageModel`, JSON tolérant), `OrientationTexts`, `PlainLanguageWriter`.
- `Application/Query` : `SearchServices`, `RefineServiceSearch`, `Orient`, `Explain` (bus `query.bus`, sans transaction).
- Ports : `Application/Ports/Provider/ServiceCatalog` (+ DTO `CatalogService`), implémenté par `Administration/Infrastructure/Adapter/Assistance/AdminAssistanceServiceCatalog`.
- Adaptateurs fournis : `Infrastructure/Adapter/Administration/AssistancePlainLanguageDrafter`, `Infrastructure/Adapter/Communication/AssistancePublicationPlainLanguageDrafter`.

## Questions ouvertes

- Journal anonyme des recherches sans résultat (pour enrichir les synonymes) : non livré, aucune donnée n’est conservée.
- Port vers Participation (projets, consultations) : non livré ; l’assistant renvoie vers `/participer` par règle.
- Traduction des versions « En clair » (F89) en anglais et en arabe : non livrée, le français est affiché avec `lang="fr"`.

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [ADR 011](../../../../doc/technique/decisions/011-bc-assistance.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [Site — assistance](../../../../front/apps/site/doc/assistance.md)
<!-- backlinks:end -->
