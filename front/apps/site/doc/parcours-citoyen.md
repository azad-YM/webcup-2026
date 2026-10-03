# Parcours citoyen — inscription, espace et profil

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Parcours citoyen
<!-- navigation:end -->

Les règles (qui devient citoyen, champs du profil, profil « complété ») et le contrat HTTP appartiennent à [Citizen](../../../../api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1). Cette page décrit le comportement du site.

## 1. Créer son compte (`/inscription`)

**Étape 1 sur 2 — Mon compte** : adresse e-mail, mot de passe (8 à 72 caractères) et confirmation. Le site vérifie la saisie avant l’envoi, place le focus sur le premier champ en erreur et relie chaque message à son champ.

Enchaînement (use case `register` du module `auth`) : `POST /api/citizen/register` via le port `AccountRegistrationGateway` (fourni par le module `citizen`), puis `POST /api/login_check` avec les mêmes identifiants, puis passage à `/inscription?etape=informations`.

| Situation | Comportement |
|---|---|
| `409` | « Un compte existe déjà avec cet e-mail » et lien « Se connecter avec cet e-mail ». |
| `422` avec `path` (`email`, `password`) | Message compréhensible sous le champ concerné. |
| `422` sans champ (`{ error }`, refus IAM) | Message général, sans le texte technique. |
| Panne réseau | Message, saisie conservée ; le même bouton permet de réessayer. |
| Compte créé mais connexion automatique impossible | Message et lien vers la connexion. |
| Double clic | Bouton désactivé et envoi verrouillé tant que la requête est en cours. |

**Étape 2 sur 2 — Mes informations** (facultative) : prénom, nom, téléphone, adresse, quartier, langue préférée. Le formulaire est pré-rempli par `GET /api/citizen/me`. « Enregistrer et accéder à mon espace » envoie `PUT /api/citizen/me`, puis ouvre `/espace` ; « Passer cette étape » ouvre directement `/espace`.

Un visiteur déjà connecté qui ouvre `/inscription` est envoyé vers `/espace` ; l’étape 2 sans session revient à l’étape 1.

## 2. Espace personnel (`/espace`)

Garde : une session est requise (sinon invitation à se connecter, avec retour vers la page demandée), puis `GET /api/citizen/me`.

| Résultat | Comportement |
|---|---|
| `200` | « Bonjour <prénom> » (ou « Bonjour »), invitation « Complétez votre profil » si `profileCompleted` est faux, raccourcis (services, actualités, « Mes demandes » bientôt disponible, profil), résumé « Mes informations », et carte « Administration » si le compte a cet espace IAM. |
| `404` | « Ce compte n’est pas un compte citoyen » et liste des espaces IAM (carte « Administration » pour un membre, sinon « aucun espace »). |
| `401` | Session fermée, caches vidés, invitation à se reconnecter. |
| Panne réseau ou `5xx` | Message et « Réessayer », sans déconnexion. |

## 3. Mon profil (`/espace/profil`)

Même garde. Formulaire pré-rempli. `PUT /api/citizen/me` **remplace tout le profil** : le site envoie toujours les six champs, champ vide → `null`. Après l’enregistrement : « Vos informations ont été enregistrées. » (annonce `aria-live`) et lien de retour vers l’espace. Un `422` rattaché à un champ s’affiche sous ce champ ; la saisie est conservée en cas d’erreur.

## Dépendances et limites

- Le parcours de bout en bout dépend de l’API Citizen (lot L1, agent A). Sans elle, `/espace` affiche « ce compte n’est pas un compte citoyen » (la route répond `404`) et l’inscription échoue avec un message ; la connexion IAM et la carte « Administration » continuent de fonctionner.
- La langue préférée propose « Français » et « English » ; une autre valeur déjà enregistrée reste affichée et conservée. L’API ne contrôle que sa longueur (≤ 5).
- L’e-mail du compte n’est pas affiché dans l’espace (il viendrait de `GET /api/iam/me`).

Code : modules `auth` (`ui/pages/registration.tsx`, `core/application/usecases/register.usecase.ts`) et `citizen` (`ui/pages`, `core/application/usecases/my-profile.usecase.ts`, `core/infrastructure/for-production/gateway/http/citizen.http.gateway.ts`). Tests : `registration.test.ts`, `citizen.test.ts`, `citizen.http.test.ts`, `citizen-profile.test.ts`.

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Parcours de connexion](parcours-connexion.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
<!-- backlinks:end -->
