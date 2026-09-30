# IAM — comptes, sessions et espaces

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [IAM](README.md) › Comptes et sessions
<!-- navigation:end -->

## Comptes

- Table `auth_users` : identifiant, e-mail unique, empreinte du mot de passe, nom.
- `CreateAccount` (appelé par `AddMember` via le port interne `MemberAccountProvisioner`) normalise l’e-mail en minuscules, exige un mot de passe de 8 à 72 octets, refuse un e-mail existant (`EmailAlreadyUsed`) et ne remplace jamais un mot de passe existant. Il n’attribue aucun rôle.

## Login et profil

- `POST /api/login_check` `{email, password}` → `{token}` (audience `site`) ; échec → 401.
- `GET /api/iam/me` → `{email, name, spaces}`.
- `GET /api/iam/me/spaces` → liste de `{code, name, description, roles}` ; `[]` sans accès.

L’identité provient toujours du JWT vérifié, jamais d’un paramètre. Les espaces sont agrégés depuis les fournisseurs `AccessibleSpacesProvider` (tag `iam.accessible_spaces`) et dédupliqués par code ; une panne d’un fournisseur fait échouer la requête. Un espace affiché ne vaut pas autorisation API.

Fournisseur branché : `AdminAccessibleSpacesProvider` (`Infrastructure/Service`) → espace `admin` pour tout membre actif.

## Passage site → admin (PKCE)

1. L’admin (`/auth/start`) génère un état et un vérificateur, stockés dans son sessionStorage, et redirige vers `/sso` du site avec l’état et le challenge SHA-256.
2. Le site authentifié appelle `POST /api/iam/portal-codes` `{destination: "admin", challenge}` → `{code}`.
3. Le site redirige vers le callback configuré de l’admin avec `code` et `state` (jamais de JWT).
4. L’admin vérifie l’état puis appelle `POST /api/iam/portal-sessions` `{code, destination, verifier}` → `{token}` (audience `admin`, même expiration que la session source).

Garanties : code aléatoire (64 hex), stocké haché dans `iam_portal_login_codes`, expiration ≤ 60 s, consommation atomique unique, accès revérifié à l’émission et à l’échange. Preuve invalide, expiration, réutilisation ou accès retiré → 403 ; payload invalide → 422. Un jeton d’audience `admin` ne peut pas émettre de code.

## Limites connues

La déconnexion est locale à chaque application ; la révocation serveur commune reste à concevoir (voir [décisions à instruire](../../../../doc/technique/decisions/README.md)). Les codes expirés non consommés ne sont pas purgés.

<!-- backlinks:start -->
---

[← Retour à IAM](README.md)

**Référencé depuis :**

- [Architecture technique](../../../../doc/technique/architecture.md)
- [Parcours de connexion du site](../../../../front/apps/site/doc/parcours-connexion.md)
<!-- backlinks:end -->
