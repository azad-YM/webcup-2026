# Accessibilité, repères et langage clair (site)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Accessibilité
<!-- navigation:end -->

Lot L4 du [chantier](../../../../doc/chantier/README.md) : F21, F23, F24, D15, D12, F35, D13, D20, F41, F42, F43, F44. Même socle que l’[admin](../../admin/doc/accessibilite.md), mis en commun dans `@boilerplate/shared-ui` (voir [packages](../../../packages/AGENTS.md)). **🟡 Non vérifié dans un navigateur ni avec un lecteur d’écran ; aucun test automatisé écrit.**

## Pour qui, pourquoi

Tous les habitants, y compris les personnes qui naviguent au clavier, avec un lecteur d’écran, avec un fort zoom ou qui lisent difficilement. Pas de parcours à part (D20) : les réglages s’appliquent aux mêmes pages.

## Ce qui est fait

| Besoin | Mise en œuvre | Demandes |
|---|---|---|
| Panneau « Affichage et accessibilité » | Bouton « Affichage » dans l’en-tête (bureau et menu mobile) ; fenêtre de dialogue Radix (focus piégé, Échap, retour du focus). Taille du texte 100 / 125 / 150 %, contraste élevé, réduction des animations, « Revoir le guide et les astuces ». | F23, F24, F43, F44 |
| Préférences sans flash | Script bloquant dans `<head>` (`displayPreferencesBootScript`) puis `SiteAccessibilityProvider` ; stockage par la gateway locale `createLocalStorageDisplayPreferencesGateway` (clé `nova-terra.site.affichage`, composée dans `modules/shared/ui/accessibility-provider.tsx`). | F24 |
| Zoom 200 % et 320 px | Tailles en `rem`, en-tête qui passe à la ligne, en-tête non collant à 150 % ou quand la hauteur est faible (`.site-header`), coupure des mots longs. | F24, F44 |
| Contraste | Palette AA ; `--muted-foreground` et bordures de champ assombries ; mode contraste élevé (textes ≈ noir, bordures marquées, liens soulignés, focus noir et jaune). | F23 |
| Couleur jamais seule | États des demandes : `StatusBadge` partagé (icône + libellé + bordure, préfixe « État : » lu par les lecteurs d’écran) ; alertes : libellé de gravité + icône ; messages d’erreur et de succès avec icône et préfixe « Erreur : ». | F43 |
| Lecteur d’écran et formulaires | Repères `header`/`nav`/`main#contenu`/`footer`, lien d’évitement, un `h1` par page ; champs : `label`, aide et erreur dans `aria-describedby`, `aria-invalid` ; connexion : erreur reliée aux deux champs ; suppression de compte : focus sur le mot de passe à l’ouverture, retour au bouton à l’annulation, erreur reliée ; annonces `aria-live`. | F21, F42 |
| Clavier | Focus toujours visible (contour orange 3 px + halo blanc, hors couche CSS pour primer sur `outline-none`) ; aucun piège ; astuces refermables qui laissent le focus en place. | F41 |
| Fil d’Ariane | Toutes les pages hors accueil ; rendu par `BreadcrumbTrail` partagé (liens soulignés). | D15 |
| Première visite | `/espace` : guide en trois étapes (compléter le profil, trouver un service, faire une demande), masquable, mémorisé (`nova-terra.site.indications-vues`). | D12 |
| Astuces au bon moment | `/services` (recherche) et `/espace/demandes/nouvelle` (bien décrire sa demande) : `ContextualTip`, refermable, vue une fois. | F35 |
| Langage clair | « démarches » → « demandes » ou « services », « référence » → « numéro de suivi », « session expirée » → « déconnecté pour votre sécurité », catégorie « Papiers et citoyenneté », messages d’erreur techniques traduits (`getErrorMessage`). Glossaire `/aide/glossaire` (lien en pied de page, dans le guide et sur la confirmation de demande). | D13 |

## Vérifier à la main

1. **Clavier** : depuis la barre d’adresse, `Tab` → « Aller au contenu » apparaît ; parcourir en-tête, fil d’Ariane, formulaire ; le contour de focus est toujours visible. Ouvrir « Affichage » avec Entrée, `Tab` reste dans la fenêtre, `Échap` la ferme et rend le focus au bouton.
2. **Lecteur d’écran** (VoiceOver `Cmd+F5`, NVDA) : liste des repères et des titres ; envoyer `/inscription` vide → le focus va au premier champ en erreur, l’erreur est lue avec le libellé ; `/connexion` avec un mauvais mot de passe → message annoncé et champs marqués invalides.
3. **Zoom** : navigateur à 200 % puis fenêtre à 320 px de large → pas de défilement horizontal, rien ne se chevauche ; régler le texte à 150 % dans le panneau et recharger : pas de flash à 100 %.
4. **Couleur** : activer le contraste élevé ; en niveaux de gris (outil du système), les états des demandes restent distinguables par icône et libellé.
5. **Guide et astuces** : premier passage sur `/espace` → guide visible ; « Masquer le guide » → il ne revient pas après rechargement ; « Revoir le guide et les astuces » dans le panneau le réaffiche.

## Limites

- Aucun audit outillé (axe, Lighthouse) ni test utilisateur ; contrastes vérifiés par calcul sur la palette, pas écran par écran.
- Pas de résumé d’erreurs en tête de formulaire : le focus va au premier champ en erreur (choix retenu ; `ErrorSummary` est disponible dans `shared-ui`).
- Les préférences restent dans le navigateur (pas de synchronisation avec le compte).
- Contenus saisis par les agents (actualités, alertes) : leur clarté dépend des rédacteurs.

<!-- backlinks:start -->
---

[← Retour au site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Admin — accessibilité](../../admin/doc/accessibilite.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
