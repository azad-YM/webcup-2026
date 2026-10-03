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
- [Citizen](../../Citizen/doc/README.md) (cible) : création de compte à l’inscription d’un citoyen.

## Livré

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/login_check` | Login, JWT d’audience `site` |
| POST | `/api/auth/register` | Inscription historique (dette : protégée par le firewall, hors bus) |
| GET | `/api/iam/me`, `/api/iam/me/spaces` | Profil et espaces accessibles |
| POST | `/api/iam/portal-codes`, `/api/iam/portal-sessions` | Passage site → admin (PKCE) |

Adaptateurs fournis : `Infrastructure/Adapter/Administration/IAMCurrentAccountProvider` et `IAMMemberAccountProvisioner`.

## Cible retenue

Inscription publique d’un citoyen portée par Citizen, avec un adaptateur IAM de création de compte ; retrait de `/api/auth/register` une fois ce parcours livré.

## Questions ouvertes

Changement et réinitialisation du mot de passe, révocation commune des sessions, purge des codes expirés, connexion par code envoyé par e-mail.

## Référence

- [Comptes, sessions et espaces](comptes-et-sessions.md)
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
