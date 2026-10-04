# ADR 011 — Un BC Assistance pour orienter les habitants, avec un modèle de langage facultatif

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 011
<!-- navigation:end -->

- Statut : accepté (décision de l’utilisatrice : API Claude via le port Shared `LanguageModel`, avec repli local), BC créé au lot L22 — [documentation](../../../api/src/Assistance/doc/README.md)
- Date : 2026-10-04
- S’appuie sur : [ADR 002](002-frontieres-et-acces.md) (ports), [ADR 007](007-protection-des-donnees.md) (limitation de débit, données personnelles)

## Contexte

Le lot L22 regroupe D10 (trouver le bon service malgré une demande mal formulée), F91 et F92 (assistant d’orientation), F90 (explication plus simple à la demande) et F89 (version en langage clair des informations essentielles). Ces besoins lisent le catalogue des services (Administration) et les publications (Communication) mais n’en sont pas propriétaires. Ils peuvent utiliser un modèle de langage, qui doit rester facultatif : la démonstration fonctionne sans clé, et une panne du fournisseur ne doit rien bloquer.

## Options étudiées

1. **Mettre la recherche et l’assistant dans Administration** : simple, mais Administration porterait des prompts, un vocabulaire du quotidien et des règles de conversation sans rapport avec l’organisation municipale.
2. **Tout faire dans le front** : pas de clé possible côté navigateur, garde-fous contournables.
3. **Créer un BC Assistance** sans persistance, consommateur du catalogue par un port (retenu).

## Décision

- BC `Assistance` (`api/src/Assistance`), **sans table** : recherche tolérante (`ServiceFinder` : accents, pluriels, fautes de frappe, mots du quotidien), assistant d’orientation, explications simples, brouillons « En clair ».
- Modèle de langage par le port Shared `LanguageModel` (API Claude, clé `ANTHROPIC_API_KEY` côté serveur). Chaque usage a un **repli local** utile et la réponse dit sa source (`model` ou `local`) ; l’interface l’affiche.
- Garde-fous : urgence vitale ou danger détectés par règles **avant** le modèle (15, 17, 18, 112, `/urgences`) ; le modèle répond en JSON et ses identifiants de services sont **validés contre le catalogue fourni** ; aucune donnée d’identité dans les prompts ; rien n’est stocké (pas de journal des conversations) ; routes POST limitées par IP (`security_hardening.yaml`).
- Raccordements :

| Consommateur (port) | Fournisseur (adaptateur) | Besoin |
|---|---|---|
| Assistance — `ServiceCatalog` | `Administration/Infrastructure/Adapter/Assistance/AdminAssistanceServiceCatalog` | textes publics, thème, état, lieu, urgence, traductions, version en clair |
| Administration — `PlainLanguageDrafter` | `Assistance/Infrastructure/Adapter/Administration/AssistancePlainLanguageDrafter` | brouillon « En clair » d’une fiche (F89) |
| Communication — `PlainLanguageDrafter` | `Assistance/Infrastructure/Adapter/Communication/AssistancePublicationPlainLanguageDrafter` | brouillon « En clair » d’une publication (F89) |

- La version « En clair » validée appartient au propriétaire du contenu (`municipal_service.plain_language`, `communication_publication.plain_language`) : rien n’est publié sans que l’agent enregistre.

## Conséquences

- Nouveau BC : autoload `Assistance\`, services, routes `/api/assistance/*` publiques (lecture et POST limités), `doc` et `AGENTS.md`. Migration `Version20261004110000` (colonnes `plain_language`).
- Pas de port vers Participation au lancement : l’assistant renvoie vers `/participer` par règle.
- Questions ouvertes : voir la [documentation du BC](../../../api/src/Assistance/doc/README.md#questions-ouvertes).

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Architecture technique](../architecture.md)
- [Assistance](../../../api/src/Assistance/doc/README.md)
<!-- backlinks:end -->
