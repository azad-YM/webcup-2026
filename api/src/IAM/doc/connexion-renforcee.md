# IAM — connexion renforcée (lot L15)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [IAM](README.md) › Connexion renforcée
<!-- navigation:end -->

Demandes Webcup : D02 (se connecter sans mot de passe classique), F53 (vérification supplémentaire), F54 (être prévenu d’une connexion depuis un nouvel appareil). **État : 🟡 livré côté API et site, non testé, non vérifié dans un navigateur.**

Décisions de l’utilisatrice : la connexion sans mot de passe se fait par **lien e-mail à usage unique**, en plus du mot de passe ; la vérification supplémentaire est un **code à 6 chiffres envoyé par e-mail**, que le citoyen active lui-même.

## Parcours

1. **Première étape** : mot de passe (`POST /api/login_check`) ou lien reçu par e-mail (`POST /api/iam/login-links`, puis `POST /api/iam/login-links/consume` depuis la page `/connexion/lien` du site).
2. **Seconde étape (F53)**, seulement si la vérification est active et que l’appareil n’est pas « de confiance » : un code est envoyé, la réponse est `{verificationRequired: true, challengeId, emailHint, expiresIn}` au lieu de `{token}` ; le site demande le code (`POST /api/iam/sign-in/verify`).
3. **Fin commune** (`Application/Service/SignInFlow`) : appareil reconnu ou enregistré (F54), connexion tracée, puis **même session que la connexion par mot de passe** : JWT d’audience `site` avec `uid`, `sv` (version de session) et `did` (appareil reconnu).

Mêmes contrôles quelle que soit la méthode : limiteur F37, compte suspendu (`403 account_suspended`), compte supprimé traité comme inexistant, version de session. Aucun JWT dans une URL.

## Contrat HTTP

| Méthode | Route | Accès | Corps → réponse |
|---|---|---|---|
| POST | `/api/login_check` | public | `{email, password, deviceId?}` → `{token}` ou seconde étape |
| POST | `/api/iam/login-links` | public | `{email}` → `{sent: true, browserSecret, expiresIn: 600}` (**identique** que le compte existe ou non) |
| POST | `/api/iam/login-links/consume` | public | `{token, browserSecret, deviceId?}` → `{token}` ou seconde étape |
| POST | `/api/iam/sign-in/verify` | public | `{challengeId, code, trustDevice}` → `{token}` |
| POST | `/api/iam/sign-in/resend` | public | `{challengeId}` → `{sent, expiresIn, remainingSends}` |
| GET | `/api/iam/me/security` | connecté | `{emailHint, emailAvailable, emailVerificationEnabled, devices[], recentSignIns[]}` |
| POST | `/api/iam/me/reconfirmation-codes` | connecté | aucun corps → `{challengeId, emailHint, expiresIn}` |
| PUT | `/api/iam/me/email-verification` | connecté | `{enabled, password?, challengeId?, code?}` → `{emailVerificationEnabled}` |
| POST | `/api/iam/me/devices/report` | connecté | `{deviceId}` → `{token, signedOutEverywhere}` |
| PUT | `/api/iam/me/password` | connecté | `{currentPassword, newPassword}` → `{token, changed}` |

Refus contractuels : `{code, error}` (message français affichable) avec le statut HTTP — `link_invalid` (410), `other_browser` (403), `invalid_code` (422, `remainingAttempts`), `too_many_attempts` (429), `challenge_expired` / `code_expired` (410), `resend_too_soon` / `resend_exhausted` (429, `retryAfter`), `invalid_password` (403), `email_unavailable` (422), `login_throttled` (429, en-tête `Retry-After`), `account_suspended` (403).

**Transaction et refus** : un essai de code manqué, un lien refusé ou une demande comptée par le limiteur doivent rester enregistrés. Les handlers retournent donc ces refus (`Application/Service/Outcome`, clé interne `httpStatus`) au lieu de lever une exception, ce qui annulerait la transaction du `command.bus` ; les contrôleurs les traduisent en statut HTTP (`Application/Controller/RendersOutcome`).

## Lien de connexion (D02)

- Jeton aléatoire de 256 bits, stocké **haché** (SHA-256) dans `iam_login_links`, valable **10 minutes**, **usage unique** (suppression conditionnelle : deux ouvertures simultanées ne donnent qu’une session).
- **Lié au navigateur demandeur** : la demande renvoie un secret de navigateur (256 bits, stocké haché). La consommation exige le jeton du lien **et** ce secret. Un lien transféré ou intercepté ne suffit pas ; il n’est alors pas consommé et reste utilisable dans le bon navigateur. Le site affiche un message clair (« ouvrez ce lien dans le navigateur où vous l’avez demandé »).
- **Pas d’énumération** : réponse identique, compte existant ou non ; e-mail envoyé seulement à un compte actif ayant une adresse. L’envoi passe par le worker (`SendEmailMessage` routé vers `async`) : la durée de la requête ne trahit pas l’existence du compte.
- **Débit limité** (réutilise F37, `LoginAttemptLimiter`) : un verrouillage en cours refuse la demande (`429`) ; chaque demande et chaque lien invalide comptent au seuil de l’adresse IP (30 par quart d’heure) ; au plus 3 liens envoyés par compte et par quart d’heure (les suivants reçoivent la même réponse, sans e-mail). Une connexion réussie remet à zéro les compteurs du compte.
- E-mail en texte clair, en français, via le Mailer Symfony (`MAILER_DSN`, Mailpit en développement : `http://localhost:8025`). Le lien pointe vers `SITE_URL/connexion/lien?jeton=…`.

## Vérification supplémentaire (F53)

- Activée par le titulaire dans « Sécurité du compte » : l’activation exige un code reçu par e-mail (preuve que les messages arrivent) ; la désactivation accepte le mot de passe **ou** un code.
- Code à 6 chiffres, stocké haché (lié à l’identifiant du défi), **10 minutes**, **5 essais** (au 5ᵉ échec le défi est annulé : recommencer la connexion), **3 envois** au plus (1 + 2 renvois) espacés d’une minute. Un seul défi actif par compte et par usage (`iam_verification_challenges`).
- « **Faire confiance à cet appareil** » (case à cocher) : le code n’est plus demandé sur cet appareil pendant 30 jours. « Ce n’était pas moi » retire la confiance de tous les appareils.
- Sans adresse e-mail (comptes créés à l’accueil, lot L21), la vérification et le lien sont indisponibles, avec un message explicatif.
- **Hors portée** : codes de secours. Un citoyen qui perd l’accès à sa messagerie s’adresse à l’accueil de la mairie.

## Appareils et alerte (F54)

- Le site crée une fois un identifiant d’appareil aléatoire (stockage local) et l’envoie à chaque connexion (`deviceId`) ; IAM n’en garde que l’empreinte (`iam_known_devices`), avec un résumé « Navigateur sur système » déduit du `User-Agent` (`Domain/DeviceLabel`), les dates de première et de dernière utilisation et la confiance éventuelle.
- Sans identifiant, la connexion compte comme un appareil inconnu (jamais une dispense d’alerte).
- **Nouvel appareil** : si le compte en connaissait déjà au moins un, `KnownDevice` enregistre `NewDeviceSignedIn` ; `Application/Listener/AlertOnNewDevice` (worker) envoie un e-mail et appelle le port `AccountSecurityNotifier`, implémenté par Citizen (`Citizen/Infrastructure/Adapter/IAM/CitizenAccountSecurityNotifier`), qui crée une notification `security.new_device` dans l’espace citoyen ([notifications](../../Citizen/doc/notifications.md)). La toute première connexion d’un compte ne déclenche pas d’alerte.
- Connexions réussies tracées dans `iam_sign_ins` (date, méthode, code demandé ou non, appareil, adresse IP), conservées 90 jours.
- « **Ce n’était pas moi** » : incrémente `sessionVersion` (toutes les sessions sont fermées, codes de portail supprimés), oublie l’appareil signalé, retire toute confiance, puis rend une nouvelle session à l’appareil courant pour changer aussitôt le mot de passe (`PUT /api/iam/me/password`, qui ferme aussi les autres sessions).
- La suppression du compte efface appareils, connexions, liens et codes (`ChangeAccountStatus`).

## Données exportées (F55)

IAM fournit à Citizen les données du compte, des appareils et des connexions récentes, et la confirmation d’identité (mot de passe ou code), par le port de Citizen `PersonalAccountDataProvider` (adaptateur `Infrastructure/Adapter/Citizen/IAMPersonalAccountDataProvider`). Voir [Citizen — mes données](../../Citizen/doc/mes-donnees.md).

## Persistance et configuration

Migration `Version20261003121000` : colonne `auth_users.email_verification` (défaut 0) et tables `iam_known_devices`, `iam_sign_ins`, `iam_login_links`, `iam_verification_challenges`. Variables : `SITE_URL` (liens des e-mails), `MAILER_FROM`, `MAILER_DSN` (Mailpit ajouté à `docker/compose.dev.yaml`). Le worker Messenger doit tourner pour envoyer les e-mails et les alertes.

## Limites et questions ouvertes

- Ni testé ni vérifié dans un navigateur ; aucun test automatisé écrit (décision d’économie du chantier).
- Le secret du lien est gardé dans le **stockage local** du navigateur et non dans le stockage de session prévu au départ : le lien reçu par e-mail s’ouvre dans un nouvel onglet, qui ne partage pas le stockage de session. Il expire avec le lien (10 minutes) et est effacé après usage.
- Les liens et codes expirés non consommés ne sont pas purgés (comme les codes de portail).
- Le résumé d’appareil vient du `User-Agent`, qu’un attaquant peut imiter ; l’alerte repose sur l’identifiant aléatoire, pas sur ce résumé.
- Pas de codes de secours, pas de clés d’accès (passkeys).

<!-- backlinks:start -->
---

[← Retour à IAM](README.md)

**Référencé depuis :**

- [IAM](README.md)
- [Comptes et sessions](comptes-et-sessions.md)
- [Parcours de connexion du site](../../../../front/apps/site/doc/parcours-connexion.md)
- [Citizen — mes données](../../Citizen/doc/mes-donnees.md)
- [Citizen — notifications](../../Citizen/doc/notifications.md)
<!-- backlinks:end -->
