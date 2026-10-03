# Journal de sécurité des connexions

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Journal de sécurité
<!-- navigation:end -->

Les administrateurs voient les tentatives de connexion suspectes (F37, lot L8). Point d’entrée : `/admin/security`, lien « Journal de sécurité » de la barre latérale ; permission `admin.security.read` (administrateur principal par défaut). Statut : 🟡 livré, non vérifié dans un navigateur.

## Parcours livré

1. La page charge `GET /api/iam/security/login-events` (module `security`, port `SecurityJournalGateway`, session fournie par le module `auth` via `AuthSecuritySessionProvider`).
2. Tableau du plus récent au plus ancien : date, motif (compte ciblé depuis une même adresse, compte ciblé depuis plusieurs adresses, adresse essayant plusieurs comptes), compte visé, adresse IP, nombre d’échecs, durée du verrouillage. Chaque ligne correspond à un verrouillage temporaire déclenché par IAM.
3. Filtre par e-mail ou IP (`?q=`), bouton « Actualiser » ; état vide « Aucune tentative suspecte sur les 90 derniers jours ».
4. Erreurs : 403 (permission manquante), panne, avec « Réessayer » ; 401 invalide la session.

Pas de mise à jour en temps réel : la page s’actualise à la demande. Règles de verrouillage : [IAM — protection des connexions](../../../../api/src/IAM/doc/comptes-et-sessions.md#protection-contre-les-tentatives-de-connexion-f37).

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [IAM — comptes et sessions](../../../../api/src/IAM/doc/comptes-et-sessions.md)
<!-- backlinks:end -->
