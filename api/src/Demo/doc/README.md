# Demo — jeu de démonstration

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › Demo
<!-- navigation:end -->

## Mission

Peupler une instance (locale, préproduction ou production de concours) avec des données fictives cohérentes pour apprécier le produit : comptes, services, demandes traitées, publications, participation et rendez-vous. Consommateurs : l’équipe et le jury, via la CLI. Aucun parcours HTTP.

## Exécution

Prérequis : schéma migré et administrateur créé (`app:admin:bootstrap`, voir l’[initialisation](../../Administration/doc/initialisation-admin.md)).

```sh
php bin/console app:demo:seed                     # demande confirmation
php bin/console app:demo:seed -n                  # sans question (scripts)
php bin/console app:demo:seed --admin-email=admin@ville.example --email-domain=example.com
```

La commande refuse de s’exécuter si l’administrateur n’existe pas et ne fait rien si `citoyen01@<domaine>` existe déjà (pas de doublon). En cas d’erreur, **rien n’est enregistré** (transaction englobante).

## Contenu chargé

| Acteur / donnée | Détail |
|---|---|
| Administrateur principal | inchangé (compte de `app:admin:bootstrap`, rôle « Administrateur principal » = tout le catalogue) |
| 3 rôles | « Agent d’accueil et demandes », « Chargé de communication et participation », « Responsable des services techniques » |
| 3 agents | `agent.accueil@`, `agent.communication@`, `agent.technique@` — mot de passe `password` |
| 20 citoyens | `citoyen01@` … `citoyen20@` — mot de passe `password`, profil complet (nom, téléphone, adresse, quartier) |
| 13 services | catalogue de la ville avec horaires, carte, 1 service en maintenance, 4 services d’urgence, 1 partenaire, horaires de navettes |
| Communication | 6 publications (dont 1 brouillon), 2 alertes (quartier Port, ville), 1 message officiel du Haut Conseil |
| Demandes | 22 demandes et signalements : statuts variés, commentaires et réponses d’agents, priorités, 1 urgence médicale non prise en charge, soutiens (dont un signalement à 12 soutiens), 2 signalements liés |
| Inquiétudes | 4, dont 2 répondues |
| Participation | 3 projets, 3 consultations (choix, avis, à venir) avec réponses de 14 citoyens, 6 idées suivies, 10 avis sur les services dont 3 avec réponse |
| Rendez-vous | 36 créneaux (état civil, santé, sur 3 jours) et 6 rendez-vous réservés |

Les dates suivent l’horloge réelle : tout est créé « maintenant » (les cas d’usage ne permettent pas d’antidater). Les e-mails de confirmation partent vers les adresses fictives : utiliser un domaine sans boîte (`example.com` par défaut) ou Mailpit en local.

## Limites

- Pas d’historique sur plusieurs semaines : les tableaux de bord montrent l’activité du jour du chargement.
- Pas de commande de suppression : réinitialiser la base pour recharger.

<!-- backlinks:start -->
---
[← Retour à la documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Consignes communes](../../../../AGENTS.md)
- [Déploiement cPanel](../../../../doc/technique/deploiement-cpanel.md)
<!-- backlinks:end -->
