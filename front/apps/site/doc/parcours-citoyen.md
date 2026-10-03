# Parcours citoyen — inscription, espace, profil et demandes

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
| `200` | « Bonjour <prénom> » (ou « Bonjour »), invitation « Complétez votre profil » si `profileCompleted` est faux, raccourcis (« Contacter la mairie », « Signaler un problème », « Mes demandes », services, actualités, profil), résumé « Mes informations », et carte « Administration » si le compte a cet espace IAM. |
| `404` | « Ce compte n’est pas encore un compte citoyen », bouton **« Activer mon compte citoyen »** (`POST /api/citizen/me/activate`, puis rechargement du profil) et liste des espaces IAM (carte « Administration » pour un membre, sinon « aucun espace »). |
| `401` | Session fermée, caches vidés, invitation à se reconnecter. |
| Panne réseau ou `5xx` | Message et « Réessayer », sans déconnexion. |

## 3. Mon profil (`/espace/profil`)

Même garde. Formulaire pré-rempli. `PUT /api/citizen/me` **remplace tout le profil** : le site envoie toujours les six champs, champ vide → `null`. Après l’enregistrement : « Vos informations ont été enregistrées. » (annonce `aria-live`) et lien de retour vers l’espace. Un `422` rattaché à un champ s’affiche sous ce champ ; la saisie est conservée en cas d’erreur.

## 4. Demandes citoyennes (lot L2)

Règles et contrat : [Citizen — demandes](../../../../api/src/Citizen/doc/README.md#livré--demandes-citoyennes-lot-l2). Côté agents : [admin — demandes citoyennes](../../admin/doc/demandes.md). Même garde que l’espace sur chaque page ; un `401` ferme la session.

**Envoyer une demande** (`/espace/demandes/nouvelle?type=contact|report`, D04, F25) : titre « Contacter la mairie » ou « Signaler un problème » selon `type` (raccourcis de `/espace` et boutons de « Mes demandes »), type modifiable dans le formulaire. Champs : objet (≤ 160), description (≤ 5 000), lieu (≤ 255, **obligatoire pour un signalement**, facultatif sinon). Le site vérifie la saisie avant l’envoi (mêmes règles que l’API), place le focus sur le premier champ en erreur et verrouille le bouton pendant l’envoi. `POST /api/citizen/requests`.

**Confirmation** (D16) : dès la réponse, l’écran « Votre demande a bien été envoyée » (focus sur le titre) affiche la **référence** (`NT-2026-0042`), la date de réception, l’objet et l’état, avec « Suivre ma demande » et « Envoyer une autre demande ».

**Mes demandes** (`/espace/demandes`, D11, F26) : boutons d’envoi, puis historique (plus récentes d’abord) : type, référence, date d’envoi, objet, état. États chargement, vide (« Vous n’avez encore envoyé aucune demande ») et erreur avec « Réessayer ».

**Détail** (`/espace/demandes?ref=NT-2026-0042`, export statique) : objet, type, état, lieu, message, puis **chronologie des étapes** horodatées avec le commentaire de la mairie (« Motif : » pour un rejet). Référence inconnue ou demande d’un autre compte : « Cette demande est introuvable dans votre espace ».

**Temps réel** : tant qu’une liste ou un détail est affiché, le site écoute `request.submitted` et `request.status_changed` sur le topic `citizen.{citizenId}` (accordé par le serveur, [ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)) et recharge les demandes depuis l’API ; un rafraîchissement toutes les 60 s sert de filet de sécurité. Un seul flux SSE par onglet (`SseRealtimeSubscriber`), fermé quand plus aucun écran ne l’utilise.

Code : module `citizen` (`ui/pages/service-requests.tsx`, `ui/pages/new-service-request.tsx`, `ui/components/request-status.tsx`, `core/application/rtk-api/service-requests.ts`, `core/application/usecases/service-request.usecase.ts`, `core/infrastructure/for-production/gateway/http/service-request.http.gateway.ts`) et `shared` (`core/application/ports/realtime-subscriber.ts`, `core/infrastructure/realtime/sse-realtime.subscriber.ts`). **Aucun test automatisé ; non vérifié dans un navigateur.**

## 5. Supprimer mon compte (`/espace/profil`, F33)

Lot L8, 🟡 non vérifié dans un navigateur. Sous le formulaire du profil, la section « Supprimer mon compte » explique l’effet (profil et identifiants effacés, sessions fermées, historique des démarches conservé sans identité). « Demander la suppression » ouvre un formulaire : mot de passe actuel **et** case « Je comprends que cette suppression est définitive » obligatoires. `DELETE /api/citizen/me` `{password}` :

| Réponse | Affichage |
|---|---|
| `200` | Session locale vidée, redirection vers `/connexion?compte=supprime` (« Votre compte a été supprimé et vos sessions ont été fermées. »). |
| `403` | « Mot de passe incorrect. La suppression a été refusée. » ; le champ est vidé. |
| `409` | « Ce compte est aussi un compte d’agent actif. Contactez un administrateur avant de le supprimer. » |
| `401` | Session expirée : déconnexion. |

Règles (anonymisation, compte agent protégé) : [Citizen — compte et sécurité](../../../../api/src/Citizen/doc/compte-et-securite.md). Code : `citizen/ui/sections/delete-account.tsx`, `citizen/core/application/usecases/delete-my-account.usecase.ts`.
Le **quartier** se choisit dans une liste fermée (Nord, Sud, Est, Ouest, Centre, Port) chargée depuis `GET /api/administration/districts` ; il sert aux alertes ciblées. Une valeur ancienne hors liste reste affichée pour ne pas être effacée.

Sous l’espace personnel, la section **« Notifications de la ville »** affiche les alertes qui concernent le citoyen, les annonces importantes et la case de consentement aux alertes sanitaires : voir [vitrine et alertes](vitrine-et-alertes.md).

## Dépendances et limites

- Le parcours de bout en bout dépend de l’API Citizen (lot L1, agent A). Sans elle, `/espace` affiche « ce compte n’est pas un compte citoyen » (la route répond `404`) et l’inscription échoue avec un message ; la connexion IAM et la carte « Administration » continuent de fonctionner.
- La langue préférée propose « Français » et « English » ; une autre valeur déjà enregistrée reste affichée et conservée. L’API ne contrôle que sa longueur (≤ 5).
- L’e-mail du compte n’est pas affiché dans l’espace (il viendrait de `GET /api/iam/me`).
- Demandes : le formulaire ne propose pas encore de choisir le service concerné (catalogue local jusqu’au lot L3) ; le temps réel suppose le worker Messenger actif (sinon, rafraîchissement toutes les 60 s).

Code : modules `auth` (`ui/pages/registration.tsx`, `core/application/usecases/register.usecase.ts`) et `citizen` (`ui/pages`, `core/application/usecases/my-profile.usecase.ts`, `core/infrastructure/for-production/gateway/http/citizen.http.gateway.ts`). Tests : `registration.test.ts`, `citizen.test.ts`, `citizen.http.test.ts`, `citizen-profile.test.ts`.

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Parcours de connexion](parcours-connexion.md)
- [Chantier](../../../../doc/chantier/README.md)
- [Registre des demandes](../../../../doc/chantier/demandes.md)
- [Citizen — compte et sécurité](../../../../api/src/Citizen/doc/compte-et-securite.md)
- [Citizen](../../../../api/src/Citizen/doc/README.md)
- [Admin — demandes citoyennes](../../admin/doc/demandes.md)
- [Vitrine et alertes](vitrine-et-alertes.md)
<!-- backlinks:end -->
