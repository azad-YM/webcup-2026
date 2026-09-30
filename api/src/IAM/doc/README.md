# Documentation — IAM

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › IAM
<!-- navigation:end -->

IAM (Identity and Access Management) est le BC qui répond à « qui se connecte ? » et « qui peut faire quoi ? ». Il porte les comptes de connexion, le login JWT, le passage sécurisé du site vers les applications, ainsi que les membres d’administration, leurs rôles et le catalogue de permissions.

Consommateurs : le [site](../../../../front/apps/site/doc/README.md) (connexion, choix d’espace), l’[admin](../../../../front/apps/admin/doc/README.md) (session, rôles) et les BC qui lui délèguent leur contrôle d’accès ([Example](../../Example/doc/README.md)).

## Livré

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/login_check` | Login, JWT d’audience `site` |
| POST | `/api/auth/register` | Inscription historique |
| GET | `/api/iam/me`, `/api/iam/me/spaces` | Profil et espaces accessibles |
| POST | `/api/iam/portal-codes`, `/api/iam/portal-sessions` | Passage site → admin (PKCE) |
| GET | `/api/iam/permissions` | Catalogue des permissions |
| POST | `/api/iam/roles` | Création d’un rôle |
| POST | `/api/iam/members` | Ajout d’un membre et de son compte |

Adaptateur fourni aux autres BC : `Adapter/Example/AdminItemAccessPolicy`.

## À construire selon le produit

Changement et réinitialisation du mot de passe, invitation, révocation commune des sessions, purge des codes expirés ; liste, modification et suppression des rôles et membres ; suspension.

## Référence

- [Comptes, sessions et espaces](comptes-et-sessions.md)
- [Membres et habilitations](membres-et-habilitations.md)
- [Architecture](../../../../doc/technique/architecture.md) · [ADR 002 — Frontières et accès](../../../../doc/technique/decisions/002-frontieres-et-acces.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [API](../../../README.md)
- [Site](../../../../front/apps/site/doc/README.md)
- [Admin](../../../../front/apps/admin/doc/README.md)
<!-- backlinks:end -->
