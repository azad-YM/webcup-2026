# ADR 010 — Comptes d’habitant créés à l’accueil, sans e-mail obligatoire

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 010
<!-- navigation:end -->

- Statut : accepté (lot L21, demande F71) — livré, non testé
- Date : 2026-10-04

## Contexte

La ville doit accueillir environ 500 nouveaux arrivants, dont beaucoup n’ont pas d’adresse e-mail et ne parlent pas tous la même langue. L’inscription publique (Citizen, `POST /api/citizen/register`) exige un e-mail. IAM identifie un compte par son e-mail (identifiant de sécurité Symfony, colonne unique).

## Options étudiées

1. Inscription publique sans e-mail (identifiant choisi par l’habitant) : risque de doublons, pas d’accompagnement.
2. **Compte créé à l’accueil par un agent** : l’agent saisit nom, langue, téléphone et e-mail facultatifs ; le système génère un identifiant d’habitant et un code provisoire remis sur une fiche imprimée dans la langue de l’habitant.
3. Connexion par SMS : dépend d’un fournisseur externe, hors périmètre.

## Décision

Option 2, validée par l’équipe.

- **Citizen** orchestre le cas d’usage `WelcomeNewResident` (`POST /api/citizen/accounts/welcome`), autorisé par le port `CitizenAccountAccessPolicy` (permission `admin.citizen.write`, Administration), journalisé par `AuditTrail` (sans le code).
- **IAM** fournit le port Citizen `ResidentAccountProvisioner` (`IAM/Infrastructure/Adapter/Citizen/IAMResidentAccountProvisioner`, cas d’usage `CreateResidentAccount`) : identifiant `NT-XXXX-XXXX` unique, code provisoire `XXXX-XXXX` (alphabet sans 0/O/1/I), haché, renvoyé une seule fois.
- Sans e-mail, IAM enregistre une adresse technique non routable `nt-xxxx-xxxx@habitant.nova-terra.invalid` pour conserver l’unicité et l’identifiant de sécurité ; elle n’est jamais affichée (`/api/iam/me`, liste des comptes citoyens).
- Connexion : `POST /api/login_check` accepte l’identifiant d’habitant dans le champ `email`. Tant que le code provisoire n’est pas remplacé (`POST /api/iam/me/password`), l’API refuse les routes privées autres que le profil IAM (403 `password_change_required`).

## Conséquences

- Modifications localisées de `User` (deux colonnes, migration `Version20261003123200`) ; la connexion par e-mail est inchangée.
- Le changement de code ne révoque pas les autres sessions (version de session inchangée) : à revoir avec la révocation commune.
- La fiche imprimée existe en français, anglais et arabe (sens de droite à gauche).

<!-- backlinks:start -->
---

[← Retour aux décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Citizen — compte et sécurité](../../../api/src/Citizen/doc/compte-et-securite.md)
- [IAM](../../../api/src/IAM/doc/README.md)
<!-- backlinks:end -->
