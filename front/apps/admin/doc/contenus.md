# Contenus de la ville

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [admin](README.md) › Contenus
<!-- navigation:end -->

Module `content` de l’admin : les agents y rédigent ce que la ville adresse aux habitants et tiennent à jour le catalogue des services. Lots L3, L7 et L9 ; **non vérifié dans un navigateur**, aucun test écrit.

Accès : groupe « Contenus de la ville » de la deuxième barre latérale d’Administration (Publications, Alertes, Services et transports). Les opérations sont autorisées par l’API : `admin.communication.write` (publications, alertes) et `admin.service.write` (services), données au rôle « Agent municipal ». Sans permission, la page affiche un refus explicite (`403`) ; un `401` ferme la session.

## Parcours

| Écran | Ce que fait l’agent | Backend | Effet côté habitants | Demandes |
|---|---|---|---|---|
| `/contenus` — Publications | Créer, enregistrer en brouillon, publier, mettre à jour, retirer ; cocher « Annonce importante » ; filtrer par état | [Communication](../../../../api/src/Communication/doc/README.md#agents-admincommunicationwrite) `GET/PUT /api/communication/manage/publications` | [Actualités](../../site/doc/vitrine-et-alertes.md) ; une annonce importante arrive en temps réel dans les notifications des citoyens | D06, F30 |
| `/contenus/alertes` — Alertes | Titre, message, gravité, audience (tous, un quartier de la liste fermée, consentants sanitaires), début et fin de validité, recommandations rédigées à la main (une par ligne) ; diffuser, mettre à jour, retirer | `GET/PUT /api/communication/manage/alerts`, `GET /api/administration/districts` | Bandeau du site et notifications des citoyens concernés, en temps réel, pendant la validité | D18, F29, F31 |
| `/contenus/services` — Services et transports | Créer ou modifier une fiche, mettre en avant, déclarer une maintenance ou un incident (message, retour prévu, alternative), saisir les horaires d’un service de mobilité | [Administration](../../../../api/src/Administration/doc/README.md#services-municipaux-et-quartiers-lots-l3-et-l9-non-vérifiés-dans-un-navigateur) `GET/PUT /api/administration/services` | Catalogue, fiche et pastille d’état du site ; horaires des transports | D05, F28, F32, F36, F38 |
| `/contenus/services` — Lieu, urgences, traductions | Section « Lieu et urgences » (type d’urgence, adresse, quartier, latitude/longitude) et « Traductions » (anglais, arabe en `dir="rtl"` : nom, résumé, description) | mêmes routes, champs `location`, `emergency`, `translations` | [Urgences, carte et services traduits](../../site/doc/urgences-carte-langues.md) | F45, F46, F27 (non testé) |

Les erreurs de règle métier (`400`) affichent le message français de l’API ; un payload incomplet (`422`) affiche un message générique. Chaque liste distingue chargement, erreur avec « Réessayer » et liste vide.

### Désactiver un service en urgence (L18/F63 — non testé, non vérifié dans un navigateur)

Dans « Services et transports », chaque service porte un bouton « Désactiver le service » (permission `admin.service.disable`). Un petit formulaire demande le **motif, obligatoire** (5 à 500 caractères, affiché aux habitants) et rappelle l’effet immédiat : plus aucune nouvelle demande ni réservation, l’existant est conservé. Un service désactivé affiche le badge « Désactivé », son motif, sa date, et un bouton « Réactiver le service ». Backend : `POST /api/administration/services/availability` ([Administration](../../../../api/src/Administration/doc/README.md)) ; journal des actions et mise à jour du site en temps réel.

## Code

`src/modules/content` : domaine (`core/domain/content.ts`), port `ContentGateway`, adaptateur `ContentHttpGateway` (`core/infrastructure/for-production/gateway/http`), session fournie par `auth/core/infrastructure/adapter/content/AuthContentSessionProvider`, pages `ui/pages/{publications,alerts,services}.tsx` dans l’enveloppe commune `app/backoffice-layout.tsx`.

## Limites

- Pas de suppression définitive : une publication ou une alerte se retire ; un service ne se supprime pas encore.
- La liste des alertes se rafraîchit toutes les 60 s ; l’admin n’écoute pas le flux temps réel.
- Les heures sont saisies en heure locale du navigateur et envoyées en ISO 8601.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [Admin](README.md)
- [Communication](../../../../api/src/Communication/doc/README.md)
- [Administration](../../../../api/src/Administration/doc/README.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
