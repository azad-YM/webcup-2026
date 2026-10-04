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

## Session et contenu (L20/F69 — non testé, non vérifié dans un navigateur)

- Cinq minutes avant l’expiration du jeton, l’en-tête affiche « Session : N min restantes » (`auth/ui/components/session-expiry-notice.tsx`, lecture de `exp` dans le jeton) avec « Rester connecté » (`/auth/start`).
- Le build injecte une politique de sécurité du contenu (`vite.config.ts`, plugin `nova-terra-csp`) : scripts de l’application seulement, appels et flux SSE vers l’origine de `VITE_API_BASE_URL` seulement.
- Décision : [ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md).

## Activité inhabituelle (F85, non testé)

Route `/admin/activite-inhabituelle`, espace Administration, groupe « Suivi et sécurité » (`admin.security.read`). Cas d’usage : [Audit — activité inhabituelle](../../../../api/src/Audit/doc/README.md#activité-inhabituelle-et-informations-incohérentes-f85-lot-l25--non-testé).

- État de la plateforme (normal / mode allégé, ce qui reste servi, commande pour lever) ;
- compteurs : graves à traiter, nouvelles, envois de robots refusés et rafales freinées sur 24 h ;
- résumé des dernières 24 h (« Rédigé par l’assistant (IA) » ou « Résumé automatique par règles ») ;
- filtres statut et gravité, bouton « Analyser maintenant », cartes d’anomalie (gravité et statut en `StatusBadge`, explication, protection appliquée, éléments liés, « Marquer comme vue / traitée », « Rouvrir ») ;
- en-tête de l’admin : alerte en direct « Alerte de sécurité grave » (événement `security.anomaly_detected`), lien vers l’écran ; actualisation toutes les 2 minutes en filet de sécurité.

## Sauvegardes (F87, non testé)

Route `/admin/sauvegardes`, même groupe, permission `admin.backup.read` (administrateur principal ; migration `Version20261004120400`). Dernière sauvegarde, dernière vérification (verdict OK / À surveiller / Échec en clair), détail table par table, historique. Lecture seule : les sauvegardes se lancent par cron ou en ligne de commande ([procédure](../../../../doc/technique/montee-en-charge.md#sauvegarde-et-restauration-f87)).

## Envois multiples (F82)

Formulaires « Ajouter un membre », « Créer un rôle » et diffusion d’une alerte : `useProtectedSubmit` (clé d’idempotence). La fiche d’accueil (F71) n’est pas rejouée (code provisoire jamais conservé) : seul le bouton bloqué protège du double envoi.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [admin](README.md)
- [IAM — comptes et sessions](../../../../api/src/IAM/doc/comptes-et-sessions.md)
- [ADR 007](../../../../doc/technique/decisions/007-protection-des-donnees.md)
- [ADR 012](../../../../doc/technique/decisions/012-montee-en-charge-integrite-anti-abus.md)
<!-- backlinks:end -->
