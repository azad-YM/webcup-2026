# Accessibilité, repères et langage clair (admin)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [admin](README.md) › Accessibilité
<!-- navigation:end -->

Lot L4 du [chantier](../../../../doc/chantier/README.md), partie admin. Socle commun avec le [site](../../site/doc/accessibilite.md) dans `@boilerplate/shared-ui`. **🟡 Non vérifié dans un navigateur ni avec un lecteur d’écran ; aucun test automatisé écrit.**

## Ce qui est fait

| Besoin | Mise en œuvre | Demandes |
|---|---|---|
| Structure commune des espaces | `modules/shared/ui/layout/admin-content.tsx` (`AdminContent`) est rendu par l’enveloppe commune `app/backoffice-layout.tsx` pour tous les modules : barre d’en-tête, `main#contenu`, titre du document par page, focus déplacé sur le `h1` après chaque navigation. | F21, F41 |
| Lien d’évitement | `SkipLink` partagé rendu en premier dans `main.tsx` ; toutes les pages ont un `main#contenu` (y compris espaces, redirections, vérification d’accès). | F41 |
| Fil d’Ariane | Calculé depuis l’adresse (`modules/shared/ui/layout/breadcrumbs.ts`) : « Modules › Administration › Rôles »… Une nouvelle page ajoute son chemin dans `BREADCRUMB_LABELS`. | D15 |
| Panneau « Affichage » | Bouton dans chaque en-tête et sur `/espaces` ; mêmes réglages que le site. Préférences appliquées avant le premier rendu (`applyStoredDisplayPreferences` dans `main.tsx`), stockées par la gateway locale (clé `nova-terra.admin.affichage`, composée dans `shared/core/config/accessibility.ts`). | F23, F24, F44 |
| Navigation clavier | Barre latérale : `nav` nommée, `aria-current="page"`, bouton de menu avec `aria-expanded` et libellés français (« Afficher ou masquer le menu », « Fermer ») ; rail des modules et rubriques repliables, panneau mobile avec fermeture et gestion du focus ; menu des espaces : espace actuel annoncé ; menu du compte nommé « Mon compte : … » ; confirmation de suspension d’un compte citoyen : focus sur son titre puis retour au bouton. | F41 |
| Couleur jamais seule | `StatusBadge` (icône + libellé + bordure) pour les états des demandes, le compteur « en attente », la gravité et l’état des alertes, l’état des publications et des services, les membres et comptes citoyens ; carte sélectionnée de la file identifiée par une coche et « Demande ouverte ». | F43 |
| Formulaires | Erreurs reliées aux champs (`aria-describedby`, `aria-invalid`) : rôle, membre, commentaire de traitement d’une demande ; annonces `role="alert"` / `role="status"`. | F42 |
| Langage clair | « Contexte » → « Domaine » (permissions), « Audience » → « Qui doit la recevoir ? », « Référence » → « N° de suivi », page `/espaces` vouvoyée ; messages d’erreur techniques remplacés par des phrases simples (`getErrorMessage` de `shared-utils`). | D13 |

## Vérifier à la main

1. `Tab` dès l’ouverture : « Aller au contenu » ; puis menu latéral, fil d’Ariane, « Affichage », compte ; changer de page dans le menu → le titre de la page reçoit le focus et est lu.
2. « Affichage » : texte 150 %, contraste élevé ; recharger → réglage conservé sans flash ; zoom 200 % et fenêtre de 320 px → la barre latérale devient un panneau, pas de défilement horizontal de la page (les tableaux défilent dans leur cadre).
3. Lecteur d’écran sur `/demandes` : l’état de chaque demande est lu « État : En attente » ; sur `/contenus/alertes`, « Gravité : Urgence ».
4. `/admin/citizens` : « Suspendre » → le focus va sur « Confirmer la suspension » ; « Annuler » → retour au bouton.

## Limites

- Tableau de bord et pilotage non retouchés (travaux en parallèle de l’agent G) : ils profitent du socle commun (focus, contraste, fil d’Ariane) mais leurs pastilles n’ont pas été revues.
- Pas de guide de première visite côté admin (D12 et F35 concernent le site).
- Aucun audit outillé ni test utilisateur.

<!-- backlinks:start -->
---

[← Retour à l’admin](README.md)

**Référencé depuis :**

- [Admin](README.md)
- [Site — accessibilité](../../site/doc/accessibilite.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
