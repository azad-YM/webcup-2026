# ADR 007 — Protection des données : durcissement transverse et accès fins aux données sensibles

<!-- navigation:start -->
[Accueil du projet](../../../README.md) › [Documentation](../../README.md) › [Architecture](../README.md) › [Décisions](README.md) › ADR 007
<!-- navigation:end -->

- Statut : accepté, livré en partie (lot L20 : F69, F70 — non testé, non vérifié dans un navigateur)
- Date : 2026-10-04
- Complète : [ADR 002](002-frontieres-et-acces.md) (accès), [ADR 006](006-journal-des-actions.md) (journal des actions)

## Contexte

F69 demande de protéger les données sensibles **contre l’exploitation d’une faille**, de façon perceptible et sans gêner l’usage normal ; F70 demande de **réserver strictement** certaines données administratives aux agents autorisés. Les données personnelles des habitants appartiennent à Citizen (profil : téléphone, adresse ; lieu d’une demande de contact) ; les droits des agents appartiennent à Administration ; les protections HTTP (en-têtes, débit, erreurs) sont transverses. Contraintes : MySQL partagé, hébergement simple, fronts exportés en statique, aucun nouveau paquet si possible (`symfony/rate-limiter` n’est pas installé).

## Options étudiées

1. **Masquer côté interface seulement.** Rejeté : la donnée arrive dans le navigateur, une faille XSS ou un simple outil de développement suffit.
2. **Chiffrer toute la base / disque chiffré.** Hors de portée de l’application et sans effet contre une injection SQL ou une fuite d’export.
3. **Défense en profondeur dans l’application** : masquage par l’API selon une permission vérifiée par le BC propriétaire, chiffrement applicatif des champs sensibles, en-têtes et CSP, limitation de débit, erreurs sans détail. Retenu.

## Décision

### Accès fins (F70)

- Nouvelle permission `admin.sensitive-data.read`, donnée **au seul administrateur principal** ; un administrateur l’accorde à un rôle dédié (ex. « Accueil — coordonnées ») plutôt qu’à tous les agents. Le rôle de référence « Agent municipal » ne l’a pas.
- Citizen définit le port `SensitiveDataAccessPolicy` ; Administration l’implémente (`Adapter/Citizen/AdminSensitiveDataAccessPolicy`). Le service applicatif `Citizen/Application/Service/SensitiveDataDisclosure` décide du masquage dans les requêtes des agents.
- **Masqué par défaut, pour tous** ; un agent habilité demande l’affichage (`?reveal=1`). Sans la permission, la demande est ignorée : les champs restent `null` et listés dans `maskedFields`, l’admin affiche « Masqué — accès réservé ». Chaque affichage effectif est journalisé (`citizen.sensitive-data.viewed`, ADR 006), avec l’écran et le nombre de fiches.
- Écrans concernés : comptes citoyens (téléphone, adresse ; e-mail partiel `j•••@domaine`), journée des rendez-vous (téléphone), file des demandes (lieu d’une demande **de contact**, souvent le domicile). Les inquiétudes ne portent aucune identité ; le profil ne contient aucune donnée de santé (seulement l’accord aux alertes sanitaires, jamais montré aux agents).
- Inventaire des routes d’agent (aucune route oubliée) : voir [Administration — permissions](../../../api/src/Administration/doc/README.md#inventaire-des-routes-dagent-f70).

### Durcissement (F69)

- **En-têtes** (`Shared/Infrastructure/Http/SecurityHeadersListener`) : `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` restrictive, `Cross-Origin-Opener-Policy`, CSP `default-src 'none'; frame-ancestors 'none'` sur l’API, `Cache-Control: no-store` sur toute réponse authentifiée (hors flux SSE), HSTS en production derrière HTTPS.
- **CSP des fronts** : balise `<meta>` (export statique), au build seulement. Site : scripts et styles du site (`unsafe-inline` imposé par l’export Next et le script d’affichage sans flash), `connect-src` limité à l’origine de l’API (appels et SSE). Admin : `script-src 'self'` strict. `frame-ancestors` n’existe pas en `<meta>` : à poser par l’hébergeur.
- **Limitation de débit** en base (`Shared/Infrastructure/RateLimit`, table `rate_limit_counter`, fenêtre fixe, clés condensées sans IP en clair), par IP et par route d’écriture sensible (`config/packages/security_hardening.yaml`) : connexion, inscription, profil, suppression du compte, demandes, inquiétudes, soutiens, rendez-vous, ouverture de l’espace de travail. Réponse `429` en français avec `Retry-After`. Désactivée en test. Une panne de la base laisse passer (journalisée) : la limitation ne bloque jamais l’usage normal.
- **Chiffrement au repos** : type Doctrine `encrypted_string` (`Shared/Infrastructure/Doctrine/EncryptedStringType`, libsodium `secretbox`, nonce aléatoire, préfixe `enc:v1:`). Appliqué au téléphone et à l’adresse du citoyen ; la migration `Version20261003120300` chiffre l’existant. Clé `DATA_ENCRYPTION_KEY` (32 octets base64) ; vide en développement → dérivée de `APP_SECRET`. Fournie au type au démarrage du kernel.
- **Erreurs** : hors mode debug, une `500` répond un message générique en français, sans classe, SQL ni chemin.
- **Entrées** : contraintes de taille et de format ajoutées où elles manquaient (téléphone, identifiant de service, fiche de service).
- **Perceptible** : page publique « Sécurité de vos données » (`/vos-donnees/securite`, reliée depuis `/vos-donnees`), données masquées et affichage journalisé dans l’admin, annonce de l’expiration de la session admin cinq minutes avant, messages `429` expliqués.

## Conséquences

- Pas de recherche SQL ni d’index sur les colonnes chiffrées : le filtrage se fait en PHP (déjà le cas pour la liste des comptes). Un futur besoin de recherche par téléphone (accueil, comptes sans e-mail) exigera un condensé dédié (blind index), pas un `LIKE`.
- **Changer `DATA_ENCRYPTION_KEY` rend illisibles les données chiffrées** : pas de rotation outillée à ce jour ; la clé doit être sauvegardée hors base. En production, une clé dédiée est obligatoire (la dérivation d’`APP_SECRET` couple deux secrets).
- Chaque affichage des données sensibles (y compris une actualisation) produit une ligne de journal ; l’admin coupe le rafraîchissement périodique pendant l’affichage pour limiter ce bruit.
- La limitation par IP peut gêner un accueil partagé derrière une même adresse : les seuils sont larges et ajustables sans code.
- Non retenu pour l’instant : re-saisie du mot de passe avant les actions sensibles des agents (nécessite un port de vérification vers IAM), rotation de clé, purge planifiée des compteurs (purge opportuniste à 1 %).

<!-- backlinks:start -->
---

[← Retour aux décisions](README.md)

**Référencé depuis :**

- [Décisions](README.md)
- [Architecture technique](../architecture.md)
- [Shared — capacités transverses](../../../api/src/Shared/doc/capacites-transverses.md)
- [Administration](../../../api/src/Administration/doc/README.md)
- [Citizen — compte et sécurité](../../../api/src/Citizen/doc/compte-et-securite.md)
- [Site — vitrine, état des services et sécurité de vos données](../../../front/apps/site/doc/vitrine-et-alertes.md)
- [Shared](../../../api/src/Shared/doc/README.md)
- [Admin — demandes](../../../front/apps/admin/doc/demandes.md)
- [Admin — comptes citoyens](../../../front/apps/admin/doc/comptes-citoyens.md)
- [Admin — sécurité](../../../front/apps/admin/doc/securite.md)
<!-- backlinks:end -->
