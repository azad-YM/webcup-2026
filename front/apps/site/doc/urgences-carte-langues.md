# Urgences, carte, nouveaux arrivants et langues

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Site](README.md) › Urgences, carte, nouveaux arrivants et langues
<!-- navigation:end -->

Lots L11 (F45, F46), L21 (F71, F72) et L5 (D14, F27). Livré, **non testé et non vérifié dans un navigateur**.

## Parcours

| Page | Rôle | Backend |
|---|---|---|
| `/urgences` (lien rouge dans l’en-tête de toutes les pages, encart sur l’accueil) | Numéros 15, 17, 18, 112 et 114 (SMS) en grand, liens `tel:` / `sms:` ; hôpitaux, urgences, pharmacie de garde, police, pompiers avec adresse, horaires, état, « Appeler », « Itinéraire » (OpenStreetMap), « Près de moi » | [Administration — catalogue](../../../../api/src/Administration/doc/README.md#lieux-urgences-et-traductions-l11-l5) |
| `/carte` (navigation principale) | Carte Leaflet + tuiles OpenStreetMap **chargée seulement au clic** ; liste textuelle équivalente filtrable (thème, quartier, urgences seules, « près de moi »). `?service=<id>` ouvre la carte sur un lieu | idem |
| Fiche `/services?service=<id>` | Bloc « Où nous trouver » : adresse, quartier, itinéraire, mini-carte à la demande | idem |
| `/bienvenue` (accueil, espace citoyen, fiche d’accueil imprimée) | 3 questions sans inscription (foyer, besoins, soins réguliers) → check-list de premières démarches et services priorisés ; connecté : invitation à compléter le profil au lieu de s’inscrire | catalogue public |
| `/connexion` → « Je n’ai pas d’adresse e-mail » | Connexion par identifiant d’habitant `NT-XXXX-XXXX` et code | [ADR 010](../../../../doc/technique/decisions/010-comptes-crees-a-l-accueil.md), IAM `login_check` |
| `/espace/nouveau-code` | Remplacement obligatoire du code provisoire (`PUT /api/iam/me/password`) ; l’espace citoyen y renvoie tant que l’API répond 403 | [IAM](../../../../api/src/IAM/doc/README.md) |

Code : module `public` (`core/domain/service-places.ts`, `newcomer-guide.ts`, ports `places.gateway.ts`, adaptateurs navigateur `geolocation.browser.gateway.ts` et `leaflet-cdn.map.gateway.ts`, composition `ui/places-dependencies.ts`) ; module `auth` (`resident-access.*`, `ui/sections/resident-login.tsx`, `ui/pages/new-code.tsx`).

Leaflet 1.9.4 est chargé depuis cdnjs avec contrôle d’intégrité (SRI) au premier clic sur « Afficher la carte » : aucune dépendance npm, rien n’est téléchargé tant que la liste suffit. La géolocalisation n’est demandée qu’au clic et la position ne quitte pas l’appareil. Une politique CSP future devra autoriser `cdnjs.cloudflare.com` (script, style) et `tile.openstreetmap.org` (images).

## Associations partenaires (F74, L26 — non testé, non vérifié dans un navigateur)

`/partenaires` (`public/ui/pages/partners.tsx`, liste puis fiche via `?id=`) : ce que propose l’association, « Où nous trouver » (adresse, itinéraire, carte à la demande), horaires de la semaine, contact (personne, téléphone, e-mail, site) et badge « Ouvert maintenant · ferme à 18 h » / « Fermé · ouvre lundi à 9 h » calculé dans le navigateur à l’heure de Nova Terra (`openingState`, fuseau `Indian/Reunion`). Les partenaires viennent du catalogue d’Administration (catégorie `partenaires`, [contrat](../../../../api/src/Administration/doc/README.md#associations-partenaires-f74-l26--non-testé-non-vérifié-dans-un-navigateur)) : ils apparaissent aussi sur `/carte` et dans la recherche de services, dont la fiche renvoie vers `/partenaires`. Libellés en français, anglais et arabe (`PARTNERS_MESSAGES`, `cat_partenaires`). Lien dans le pied de page.

## Langues (D14) et contenus traduits (F27)

- Langues : français (défaut), anglais, arabe. Sélecteur « Langue » dans l’en-tête (liste native, chaque langue écrite dans sa langue), choix mémorisé dans le navigateur (`nova-terra.site.langue`, via `LocalePreferenceGateway`), `<html lang dir>` mis à jour ; un script de `<head>` applique `lang`/`dir` avant le premier rendu.
- Arabe : `dir="rtl"`, propriétés logiques (`ms-`, `ps-`, `border-s`) sur les pages traduites, flèches retournées (`rtl:rotate-180`), numéros de téléphone et identifiants en `dir="ltr"`, carte toujours en `ltr`.
- Mécanisme réutilisable : `defineMessages({ fr, en, ar })` (français obligatoire, repli clé par clé) et `useMessages()` (`modules/shared/core/i18n/locales.ts`, `modules/shared/ui/i18n/`).
- **Couverture** : en-tête, pied de page, fil d’Ariane, accueil, `/urgences`, `/carte`, `/bienvenue`, `/connexion` (dont l’accès sans e-mail), `/inscription` étape 1, `/espace/nouveau-code`, accueil de l’espace citoyen, catalogue et fiches de services. Restent en français : actualités, alertes, demandes, rendez-vous, participation, profil, glossaire, messages d’erreur de validation et d’API.
- Contenus : nom, résumé et description des services s’affichent dans la langue choisie, avec repli en français et mention « Non traduit » (attribut `lang="fr"` sur le texte de repli). Adresses et horaires restent en français. Publications et alertes ne sont pas traduites (cible).

## Questions ouvertes

- Créole réunionnais et espagnol écartés au profit de l’arabe (décision d’équipe).
- Synchroniser la langue de l’interface avec la langue préférée du profil citoyen.

<!-- backlinks:start -->
---

[← Retour au site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
