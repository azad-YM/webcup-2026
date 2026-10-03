# Comptes citoyens

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Comptes citoyens
<!-- navigation:end -->

Les agents habilités consultent les comptes des habitants et peuvent suspendre ou réactiver un compte (F34, lot L8). Point d’entrée : `/admin/citizens`, lien « Comptes citoyens » de la barre latérale. Statut : 🟡 livré, non vérifié dans un navigateur.

## Parcours livré

1. La page charge `GET /api/citizen/accounts` (module `citizen-accounts`, chaîne RTK → use case → `CitizenAccountsGateway` → `CitizenAccountsHttpGateway`). Elle affiche le nombre de comptes ; les mots de passe ne sont jamais transmis ni affichés.
2. Recherche côté serveur (`?q=`) sur le nom, l’e-mail, le téléphone ou le quartier, avec bouton « Effacer ». Au-delà de 200 résultats, la page invite à affiner.
3. Chaque compte montre nom, e-mail, statut (Actif / Suspendu), quartier ; « Voir les informations du profil » déplie téléphone, adresse, langue et date d’inscription.
4. Avec `admin.citizen.write`, « Suspendre » / « Réactiver » ouvre une confirmation explicite qui rappelle l’effet (sessions fermées immédiatement ; après réactivation, le citoyen se reconnecte). Un compte partagé avec un agent actif est signalé « accès protégé » sans bouton. Avec `admin.citizen.read` seul : consultation uniquement.
5. Erreurs : 403 (permission manquante), 409 (compte protégé ou supprimé), 404, panne réseau, avec « Réessayer ». Un 401 invalide la session.

Règles et contrat : [Citizen — compte et sécurité](../../../../api/src/Citizen/doc/compte-et-securite.md).

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [Citizen — compte et sécurité](../../../../api/src/Citizen/doc/compte-et-securite.md)
<!-- backlinks:end -->
