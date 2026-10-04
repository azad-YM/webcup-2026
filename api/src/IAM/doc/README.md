# Documentation — IAM

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › IAM
<!-- navigation:end -->

IAM (Identity and Access Management) est le BC qui répond à « qui se connecte ? ». Il porte les comptes de connexion de Nova Terra, le login JWT, le passage sécurisé du site vers l’espace de travail des agents et la liste des espaces accessibles à un compte.

IAM ne sait pas ce qu’est un agent ou un citoyen. Les profils métier rattachés à un compte appartiennent à leur BC : membres et rôles à [Administration](../../Administration/doc/README.md), citoyens à [Citizen](../../Citizen/doc/README.md). Ces BC demandent la création d’un compte à IAM via leurs propres ports et lui fournissent les espaces qu’ils ouvrent.

## Consommateurs

- [Site](../../../../front/apps/site/doc/README.md) : connexion, choix de l’espace, émission du code de portail.
- [Admin](../../../../front/apps/admin/doc/README.md) : échange du code, validation de la session.
- [Administration](../../Administration/doc/README.md) : compte connecté et création de compte d’un membre.
- [Citizen](../../Citizen/doc/README.md) : création de compte à l’inscription publique d’un citoyen et compte connecté.

## Livré

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/login_check` | Login, JWT d’audience `site` |
| GET | `/api/iam/me`, `/api/iam/me/spaces` | Profil et espaces accessibles |
| POST | `/api/iam/portal-codes`, `/api/iam/portal-sessions` | Passage site → admin (PKCE) |
| GET | `/api/iam/security/login-events` | Journal des verrouillages de connexion (permission `admin.security.read`, L8) |
| POST | `/api/iam/login-links`, `/api/iam/login-links/consume` | Connexion par lien e-mail à usage unique, lié au navigateur (D02, L15) |
| POST | `/api/iam/sign-in/verify`, `/api/iam/sign-in/resend` | Seconde étape : code à 6 chiffres envoyé par e-mail (F53, L15) |
| GET, POST, PUT | `/api/iam/me/security`, `/api/iam/me/reconfirmation-codes`, `/api/iam/me/email-verification`, `/api/iam/me/devices/report`, `/api/iam/me/password` | « Sécurité du compte » : vérification supplémentaire, appareils, « Ce n’était pas moi », mot de passe (F53, F54, L15) |

Lot L15 (🟡, non testé, non vérifié dans un navigateur) : lien de connexion, vérification par code e-mail, appareils reconnus et alerte de nouvel appareil. Détails : [connexion renforcée](connexion-renforcee.md).

Lot L8 (🟡, non vérifié dans un navigateur) : statut du compte (`active`, `suspended`, `deleted`) avec révocation de toutes les sessions par version de session, suppression par anonymisation, message clair pour un compte suspendu, verrouillage progressif par compte, par IP et par couple compte+IP (429), journal des verrouillages. Détails : [comptes et sessions](comptes-et-sessions.md#protection-contre-les-tentatives-de-connexion-f37).

Adaptateurs fournis :

| Consommateur | Adaptateur IAM | Rôle |
|---|---|---|
| Administration | `Infrastructure/Adapter/Administration/IAMCurrentAccountProvider` | Compte connecté |
| Administration | `Infrastructure/Adapter/Administration/IAMMemberAccountProvisioner` | Création du compte d’un membre |
| Citizen | `Infrastructure/Adapter/Citizen/IAMCitizenAccountProvisioner` | Création du compte à l’inscription (nom = partie locale de l’e-mail) |
| Citizen | `Infrastructure/Adapter/Citizen/IAMCurrentAccountProvider` | Compte connecté |
| Citizen | `Infrastructure/Adapter/Citizen/IAMPersonalAccountDataProvider` | « Mes données » (F55) : confirmation d’identité (mot de passe ou code) et données du compte, des appareils et des connexions |
| Citizen | `Infrastructure/Adapter/Citizen/IAMCitizenAccountManager` | Reconfirmation du mot de passe, e-mails par lot, suspension et suppression (anonymisation) du compte |

Lot L21 (F71, non testé) : comptes d’habitant créés à l’accueil ([ADR 010](../../../../doc/technique/decisions/010-comptes-crees-a-l-accueil.md)). `User` porte `residentId` (`NT-XXXX-XXXX`, unique) et `passwordChangeRequired` ; sans e-mail, une adresse technique `…@habitant.nova-terra.invalid` jamais affichée. `login_check` accepte l’identifiant d’habitant dans `email` ; `/api/iam/me` renvoie `residentId` et `passwordChangeRequired` ; `PasswordChangeRequiredListener` répond 403 `password_change_required` sur les routes privées tant que le code provisoire n’est pas remplacé. Adaptateur `Adapter/Citizen/IAMResidentAccountProvisioner` (cas d’usage `CreateResidentAccount`).

Port consommé par IAM : `Application/Ports/Provider/SecurityJournalAccessPolicy`, implémenté par Administration (`Adapter/IAM/AdminSecurityJournalAccessPolicy`).
Ports consommés par IAM : `Application/Ports/Provider/SecurityJournalAccessPolicy`, implémenté par Administration (`Adapter/IAM/AdminSecurityJournalAccessPolicy`) ; `Application/Ports/Provider/AccountSecurityNotifier` (F54), implémenté par Citizen (`Adapter/IAM/CitizenAccountSecurityNotifier`).

L’inscription publique est portée par Citizen (`POST /api/citizen/register`) ; l’ancienne route `POST /api/auth/register` d’IAM (hors bus, protégée par le firewall) a été retirée.

## Cible retenue

Aucune évolution d’IAM prévue pour le lot L1.

## Questions ouvertes

Réinitialisation du mot de passe oublié, codes de secours de la vérification supplémentaire, révocation serveur à la déconnexion volontaire, purge des codes et liens expirés, alerte temps réel des administrateurs lors d’un verrouillage.

## Référence

- [Comptes, sessions et espaces](comptes-et-sessions.md)
- [Connexion renforcée (L15)](connexion-renforcee.md)
- [Architecture](../../../../doc/technique/architecture.md) · [ADR 002 — Frontières et accès](../../../../doc/technique/decisions/002-frontieres-et-acces.md) · [ADR 003 — Identité et habilitations](../../../../doc/technique/decisions/003-identite-et-habilitations.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [API](../../../README.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
- [Administration](../../Administration/doc/README.md)
- [Citizen](../../Citizen/doc/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [ADR 003](../../../../doc/technique/decisions/003-identite-et-habilitations.md)
<!-- backlinks:end -->
