# IAM — comptes, sessions et espaces

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [IAM](README.md) › Comptes et sessions
<!-- navigation:end -->

## Comptes

- Table `auth_users` : identifiant, e-mail unique, empreinte du mot de passe, nom.
- `CreateAccount` (appelé par l’`AddMember` d’[Administration](../../Administration/doc/membres-et-habilitations.md) via l’adaptateur `Adapter/Administration/IAMMemberAccountProvisioner`, et par le `RegisterCitizen` de [Citizen](../../Citizen/doc/README.md#livré) via `Adapter/Citizen/IAMCitizenAccountProvisioner`) normalise l’e-mail en minuscules, exige un mot de passe de 8 à 72 octets, refuse un e-mail existant (`EmailAlreadyUsed`) et ne remplace jamais un mot de passe existant. Il n’attribue aucun rôle.
- Création publique : uniquement par l’inscription citoyenne `POST /api/citizen/register` de Citizen. L’adaptateur nomme le compte d’après la partie locale de l’e-mail et traduit `EmailAlreadyUsed` (ou une violation d’unicité) en `AccountAlreadyExists` de Citizen (409), les autres refus en `AccountCreationRejected` (422). IAM n’expose plus de route d’inscription (`/api/auth/register` retirée).

## Statut du compte et révocation des sessions (L8)

- `auth_users.status` : `active`, `suspended` ou `deleted` ; `session_version` est incrémenté à chaque changement de statut.
- Chaque JWT porte `uid` et `sv` (version de session) ; `AccountSessionListener` refuse (401) tout jeton dont le compte n’est plus actif ou dont la version ne correspond plus. Une suspension, une réactivation ou une suppression invalide donc **toutes** les sessions en cours (audiences `site` et `admin`) ; les codes de portail du compte sont supprimés. Après une réactivation, il faut se reconnecter.
- `ChangeAccountStatus` (cas d’usage interne d’IAM) est appelé par Citizen via `Adapter/Citizen/IAMCitizenAccountManager`, dans la transaction du cas d’usage Citizen. Le même adaptateur vérifie un mot de passe (reconfirmation) et fournit les e-mails de connexion par lot ; aucun mot de passe ni empreinte ne sort d’IAM.
- **Suppression = anonymisation** : l’e-mail devient `<id>@deleted.invalid` (libère l’adresse pour une nouvelle inscription), le nom est effacé, l’empreinte est remplacée par une valeur inutilisable, le statut `deleted` est définitif. La ligne est conservée pour l’intégrité des références (`userId`) détenues par les autres BC.

## Protection contre les tentatives de connexion (F37)

Avant chaque login, `PasswordAuthenticator` interroge le port `LoginAttemptLimiter` (implémentation `DoctrineLoginAttemptLimiter`, compteurs MySQL `iam_login_attempt_buckets` partagés par tous les workers, identifiants hachés en SHA-256). **Seuls les échecs comptent** ; une connexion réussie remet à zéro les compteurs du compte et du couple compte+IP.

| Portée | Seuil (fenêtre 15 min) | Verrouillage | Contre |
|---|---|---|---|
| Compte + IP | 5 échecs | 1 min, puis 2, 4, 8… | erreurs répétées ou devinette ciblée |
| Compte (toutes IP) | 10 échecs | 5 min, puis 10, 20… | attaque distribuée sur un compte |
| IP (tous comptes) | 30 échecs | 5 min, puis 10, 20… | essais d’identifiants en masse |

Le verrouillage est progressif : sa durée double à chaque récidive mémorisée 24 h, plafonnée à 1 h. Pendant un verrouillage, la requête est refusée **avant** la vérification du mot de passe : `429`, en-tête `Retry-After`, corps `{error: "Trop de tentatives de connexion. Réessayez dans X minutes.", code: "login_throttled", retryAfter}`. La réponse est identique pour un compte inexistant (pas d’énumération). L’échec qui déclenche le verrouillage reçoit déjà le `429`.

Journal : chaque verrouillage écrit une ligne dans `iam_login_security_events` (date, portée, e-mail saisi sauf pour la portée IP, IP, nombre d’échecs, durée), conservée 90 jours. `GET /api/iam/security/login-events?q=` (200 dernières entrées, filtre e-mail/IP) est autorisé par le port `SecurityJournalAccessPolicy`, implémenté par [Administration](../../Administration/doc/membres-et-habilitations.md) (`Adapter/IAM/AdminSecurityJournalAccessPolicy`, permission `admin.security.read`) ; sinon 403.

Usage normal inchangé : un utilisateur qui se trompe moins de 5 fois puis réussit ne voit aucune différence. Limite assumée : la portée « compte » permet à un attaquant de bloquer temporairement un compte (au plus 1 h par verrouillage) ; c’est le compromis retenu pour freiner une attaque distribuée.

## Login et profil

- `POST /api/login_check` `{email, password}` → `{token}` (audience `site`) ; identifiants invalides → 401 `Identifiants invalides.` ; compte suspendu (mot de passe correct uniquement) → 403 `{code: "account_suspended", error}` ; verrouillage → 429 (voir ci-dessus). Un compte supprimé répond comme un compte inexistant.
- `GET /api/iam/me` → `{email, name, spaces}`.
- `GET /api/iam/me/spaces` → liste de `{code, name, description, roles}` ; `[]` sans accès.

L’identité provient toujours du JWT vérifié, jamais d’un paramètre. Les espaces sont agrégés depuis les fournisseurs `AccessibleSpacesProvider` (tag `iam.accessible_spaces`) et dédupliqués par code ; une panne d’un fournisseur fait échouer la requête. Un espace affiché ne vaut pas autorisation API.

Fournisseur branché : `AdminAccessibleSpacesProvider`, dans l’infrastructure d’[Administration](../../Administration/doc/README.md) → espace `admin` pour tout membre actif.

## Passage site → admin (PKCE)

1. L’admin (`/auth/start`) génère un état et un vérificateur, stockés dans son sessionStorage, et redirige vers `/sso` du site avec l’état et le challenge SHA-256.
2. Le site authentifié appelle `POST /api/iam/portal-codes` `{destination: "admin", challenge}` → `{code}`.
3. Le site redirige vers le callback configuré de l’admin avec `code` et `state` (jamais de JWT).
4. L’admin vérifie l’état puis appelle `POST /api/iam/portal-sessions` `{code, destination, verifier}` → `{token}` (audience `admin`, même expiration que la session source).

Garanties : code aléatoire (64 hex), stocké haché dans `iam_portal_login_codes`, expiration ≤ 60 s, consommation atomique unique, accès revérifié à l’émission et à l’échange. Preuve invalide, expiration, réutilisation ou accès retiré → 403 ; payload invalide → 422. Un jeton d’audience `admin` ne peut pas émettre de code.

## Limites connues

La déconnexion volontaire reste locale à chaque application (le jeton n’est pas révoqué côté serveur) ; seuls les changements de statut révoquent les sessions (version de session). Les codes expirés non consommés ne sont pas purgés. Le journal de sécurité n’est pas poussé en temps réel aux administrateurs (consultation à la demande). L’IP prise en compte est celle de `Request::getClientIp()` : derrière un proxy, configurer `trusted_proxies`, sinon toutes les requêtes partagent l’IP du proxy.

<!-- backlinks:start -->
---

[← Retour à IAM](README.md)

**Référencé depuis :**

- [Architecture technique](../../../../doc/technique/architecture.md)
- [Parcours de connexion du site](../../../../front/apps/site/doc/parcours-connexion.md)
- [Administration — membres et habilitations](../../Administration/doc/membres-et-habilitations.md)
- [Citizen](../../Citizen/doc/README.md)
- [Citizen — compte et sécurité](../../Citizen/doc/compte-et-securite.md)
- [Admin — journal de sécurité](../../../../front/apps/admin/doc/securite.md)
<!-- backlinks:end -->
