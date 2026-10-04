# ADR 008 — Un BC Participation pour les projets, les consultations et la boîte à idées

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 008
<!-- navigation:end -->

- Statut : accepté (décision validée par l’utilisatrice), BC créé au lot L19 — [documentation](../../../api/src/Participation/doc/README.md)
- Date : 2026-10-03
- Précise : [ADR 003](003-identite-et-habilitations.md) (Citizen ne porte que l’identité citoyenne et ce qui touche au citoyen lui-même) et [ADR 005](005-bc-communication.md)

## Contexte

Le lot L19 regroupe F65 (soumettre des décisions à l’avis des habitants, avec trace), F66 (donner un avis non officiel et savoir qu’il est enregistré), F67 (consulter les projets en cours) et F68 (boîte à idées). Le lot L14 a déjà livré dans Citizen une « participation » limitée au citoyen : soutien des signalements publics (F52) et inquiétudes (F51), qui portent sur ses propres demandes et ses données.

Les nouveaux besoins répondent à une autre question : « sur quoi la ville associe-t-elle ses habitants, et qu’a-t-elle fait de leurs contributions ? ». Ils ont leur propre vocabulaire (projet, étape, consultation, période d’ouverture, résultat agrégé, compte rendu, idée et son statut), leur propre cycle de vie et des lecteurs anonymes (projets, résultats publiés, idées publiques).

## Options étudiées

1. **Étendre Citizen** : simple, mais Citizen deviendrait propriétaire du contenu rédigé par les agents (projets, questions, comptes rendus) et grossirait sans cohérence.
2. **Étendre Communication** : les projets ressemblent à des publications, mais les consultations et les idées reçoivent des contributions des habitants, ce que Communication ne gère pas (il diffuse).
3. **Créer un BC Participation** (retenu).

## Décision

Créer un BC `Participation`, propriétaire de :

- **Projet** (F67) : titre, résumé, description, quartier (ou toute la ville), avancement `study` / `in_progress` / `done`, étapes datées, prochaine étape ; brouillon, publié, retiré ;
- **Consultation** (F65, F66) : question posée sur une période, rattachée ou non à un projet, de type `opinion` (avis non officiel : texte libre et/ou appréciation simple) ou `consultation` (choix parmi des options et commentaire) ; résultat agrégé public à la clôture ; compte rendu « Ce que la ville en a retenu » ;
- **Contribution** : une réponse par citoyen et par consultation, modifiable tant que la consultation est ouverte, avec accusé de réception (numéro et date) ;
- **Idée** (F68) : proposition d’un citoyen, suivie par les agents (reçue, à l’étude, retenue, non retenue avec motif, réalisée), publique sauf décision motivée d’un agent.

Les soutiens et inquiétudes du lot L14 **restent dans Citizen**.

Raccordements, selon la règle des ports :

| Consommateur (port) | Fournisseur (adaptateur) | Besoin |
|---|---|---|
| Participation — `ParticipationAccessPolicy` | Administration | `admin.participation.read` / `admin.participation.write` |
| Participation — `DistrictDirectory` | Administration | liste fermée des quartiers |
| Participation — `ParticipantProvider` | Citizen | identifiant du citoyen connecté |
| Participation — `CitizenNotifier` | Citizen | notification de l’auteur d’une idée (table `citizen_notifications`) |
| Citizen — `AccountDataEraser` | Participation | effacer contributions et idées à la suppression du compte |

Les actions des agents sont journalisées par le port Shared `AuditTrail` ([ADR 006](006-journal-des-actions.md)).

## Conséquences

- Nouveau BC sur le modèle de Communication : autoload `Participation\`, services, routes, mapping Doctrine, tables `participation_*` (migration `Version20261003122000`), `doc` et `AGENTS.md`. Pas de suite PHPUnit pour l’instant (décision d’économie du chantier).
- Nouvelles permissions dans le catalogue d’Administration, données aux rôles de référence agent municipal et administrateur principal.
- Un nouveau type de notification `idea.updated` dans Citizen.
- Pas de temps réel au lancement : les écrans s’actualisent par rafraîchissement de secours (60 s) ; la notification de l’auteur d’une idée passe par le flux existant de Citizen (`notification.created`).
- Questions ouvertes : voir la [documentation du BC](../../../api/src/Participation/doc/README.md#questions-ouvertes).

<!-- backlinks:start -->
---

[← Retour à Décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Architecture technique](../architecture.md)
- [Contexte produit](../../contexte/README.md)
- [Documentation](../../README.md)
- [Participation](../../../api/src/Participation/doc/README.md)
<!-- backlinks:end -->
