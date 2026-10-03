# Site — portail des habitants

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › site
<!-- navigation:end -->

Le site est la porte d’entrée publique de Nova Terra, première ville humaine sur une autre planète. Il présente la ville, ses services et ses actualités, porte la connexion unique et l’inscription citoyenne, et offre à chaque habitant un espace personnel.

## Utilisateurs et objectifs

- **Visiteur** : comprendre immédiatement où il est, trouver un service, lire les actualités, créer son compte.
- **Citoyen** : se connecter, retrouver son espace personnel, compléter son profil ; bientôt envoyer et suivre ses demandes.
- **Membre de l’administration** (agent, administrateur) : se connecter au même endroit et ouvrir l’admin depuis la carte « Administration ».

Cible : services et publications servis par l’API (D05, D06, F28, F32), alertes (D18, F29, F30, F31), réglages d’accessibilité et langue (F21, F23, F24, D14). Suivi dans le [chantier](../../../../doc/chantier/README.md).

## Organisation

Le site réunit trois zones, chacune portée par un module `src/modules/<module>` :

| Zone | Module | Routes | Public | Backend | Demandes |
|---|---|---|---|---|---|
| Vitrine officielle | `public` | `/`, `/services` (`?service=…`, `?q=…&categorie=…`), `/actualites` (`?article=…`) ; bandeau d’alerte (cible) | Tout le monde | [Administration](../../../../api/src/Administration/doc/README.md) (services, L3) ; Communication (publications et alertes, L3, L7 — [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)) | D07, D05, D06, F28, F32, D18, F29 |
| Connexion et inscription | `auth` | `/connexion` (`?retour=…`), `/inscription` (2 étapes, `?etape=informations`) ; `/login` redirige vers `/connexion` ; `/sso` | Visiteurs | [IAM](../../../../api/src/IAM/doc/README.md), [Citizen](../../../../api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1) | D01, D03 |
| Espace citoyen | `citizen` | `/espace`, `/espace/profil`, `/espace/demandes` (`?ref=…`), `/espace/demandes/nouvelle` (`?type=contact\|report`) | Citoyens connectés | [Citizen](../../../../api/src/Citizen/doc/README.md) | D03, D12, D04, D16, F25, D11, F26, F30 |

Socle commun (module `shared`) : en-tête et navigation, pied de page, fil d’Ariane, lien d’évitement, champs de formulaire accessibles, états chargement / vide / erreur, composition des dépendances (`StoreProvider`).

Frontières entre modules (même règle que le backend) :

| Besoin | Port (consommateur) | Adaptateur (fournisseur) |
|---|---|---|
| Créer un compte à l’inscription | `auth` : `AccountRegistrationGateway` | `citizen/core/infrastructure/adapter/auth/CitizenAccountRegistrationAdapter` |
| Jeton de session pour les appels Citizen | `citizen` : `CitizenSessionProvider` | `auth/core/infrastructure/adapter/citizen/AuthCitizenSessionAdapter` |
| Étape « Mes informations », espaces IAM dans `/espace` | — | composition dans `src/app/*/page.tsx` (slots React) |
| Être prévenu des changements (temps réel) | `shared` : `core/application/ports/realtime-subscriber.ts` (`RealtimeSubscriber`) | `shared/core/infrastructure/realtime/SseRealtimeSubscriber` (client `@boilerplate/shared-utils/realtime`, un flux SSE par onglet) |

Export statique : pas de route dynamique ; les détails passent par des paramètres d’URL.

## Parcours

- [Connexion et accès aux espaces](parcours-connexion.md) : `/connexion`, `/login`, liste des espaces IAM, passage PKCE vers l’admin.
- [Parcours citoyen](parcours-citoyen.md) : inscription en deux étapes, espace personnel, profil, [demandes citoyennes](parcours-citoyen.md#4-demandes-citoyennes-lot-l2) (envoi, confirmation, suivi).
- Vitrine : accueil (présentation, « Que souhaitez-vous faire ? », recherche de service, services les plus demandés, dernières actualités, appel à créer un compte), catalogue des services avec recherche et filtre par thème, fiche d’un service, liste et lecture des actualités.

## Livré

- **Socle** : identité Nova Terra (emblème, textes, métadonnées), en-tête avec navigation (Accueil, Services, Actualités ; Connexion / Créer un compte ou Mon espace / Déconnexion selon la session ; menu mobile), pied de page, fil d’Ariane sur toutes les pages sauf l’accueil (premier niveau), lien « Aller au contenu », landmarks (`header`, `nav`, `main`, `footer`), focus visible, titres hiérarchisés, champs reliés à leur aide et à leur erreur (`aria-describedby`, `aria-invalid`), annonces `aria-live`, mouvements réduits si demandé.
- **Connexion** (IAM, livrée) : `/connexion`, retour vers la page demandée (liste fermée), `/login` conservé en redirection, liste des espaces, `/sso`.
- **Inscription et espace citoyen** : code conforme au contrat Citizen L1, testé contre un double et un `fetch` simulé. Le bout en bout dépend de l’API Citizen (agent A) — voir [parcours citoyen](parcours-citoyen.md#dépendances-et-limites).
- **Demandes citoyennes (L2)** : « Contacter la mairie », « Signaler un problème », confirmation avec la référence, « Mes demandes » (historique, détail et chronologie), mise à jour en temps réel ; code conforme au [contrat Citizen L2](../../../../api/src/Citizen/doc/README.md#contrat-http--demandes-lot-l2), **ni testé ni vérifié dans un navigateur** — voir [parcours citoyen](parcours-citoyen.md#4-demandes-citoyennes-lot-l2).
- **Vitrine** : pages et recherche livrées, **sur contenu de démonstration local** (voir limites).

## Limites et questions ouvertes

- **Contenu local** : `LocalServiceCatalogGateway` et `LocalPublicationGateway` (`public/core/infrastructure/for-production/gateway/local`) servent 8 services et 3 actualités de démonstration. Ce n’est pas une intégration : au lot L3, Administration exposera le catalogue et Communication les publications, et des adaptateurs HTTP implémentant les mêmes ports les remplaceront dans `StoreProvider`.
- Demandes : pas de choix du service concerné dans le formulaire (le contrat accepte `serviceId`, le catalogue est encore local) ; pas de pagination de « Mes demandes ».
- Langues proposées pour la préférence : français et anglais (D14, lot L5).
- Quartier en saisie libre, en attendant la décision sur une liste fermée ([Citizen — questions ouvertes](../../../../api/src/Citizen/doc/README.md#questions-ouvertes)).
- Réglages d’affichage (contraste renforcé, taille du texte) et audit lecteur d’écran restent à faire (F21, F23, F24).
- La déconnexion reste locale ; la révocation commune est à livrer côté IAM.

## Backend propriétaire

- [IAM](../../../../api/src/IAM/doc/README.md) : comptes, sessions et espaces.
- [Citizen](../../../../api/src/Citizen/doc/README.md) : inscription citoyenne, profil, demandes.
- [Administration](../../../../api/src/Administration/doc/README.md) (cible) : services municipaux.
- Communication (cible, [ADR 005](../../../../doc/technique/decisions/005-bc-communication.md)) : publications et alertes, affichées sans rechargement ([ADR 004](../../../../doc/technique/decisions/004-temps-reel.md)).

[Installation et commandes](../README.md)

<!-- backlinks:start -->
---

[← Retour à Documentation](../../../../doc/README.md)

**Référencé depuis :**

- [Documentation](../../../../doc/README.md)
- [Admin](../../admin/doc/README.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
- [Citizen](../../../../api/src/Citizen/doc/README.md)
- [Contexte produit](../../../../doc/contexte/README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
- [Parcours de connexion](parcours-connexion.md)
- [Parcours citoyen](parcours-citoyen.md)
<!-- backlinks:end -->
