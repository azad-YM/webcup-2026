# Navigation et habillage de l’administration

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [admin](README.md) › Navigation et habillage
<!-- navigation:end -->

## Livré

L’espace de travail adopte les fonds blancs et ardoise clair, les accents teal, les bordures discrètes et les arrondis du portail citoyen. Le thème est local à l’admin (`app/nova-terra.css`), y compris pour les composants partagés rendus dans un portail (menus, panneaux, modales). Les couleurs de danger et les préférences d’accessibilité restent distinctes.

- Première barre : les modules Administration, Demandes citoyennes et Pilotage, avec l’état actif indiqué. Le logo ouvre `/espaces`, l’accueil des modules.
- Seconde barre : les rubriques du module actif. Administration regroupe configuration, contenus de la ville et journaux. Les routes `/contenus/*` conservent Administration actif. Le bouton de l’en-tête replie les rubriques sur ordinateur ; sur mobile et tablette, « Menu » ouvre un panneau réunissant les deux niveaux.
- Zone principale : fil d’Ariane, réglages d’affichage et écran métier existant. Les URL, champs, confirmations, filtres, mutations et contrôles serveur ne changent pas.
- Avatar en bas du rail : identité, espaces disponibles et déconnexion. Administration est l’espace actuel ; Citoyen apparaît uniquement si le compte dispose d’un profil citoyen.

## Présentation des listes

Les demandes citoyennes utilisent des cartes entièrement cliquables avec « Voir la demande » et un état « Demande ouverte ». Le détail et ses opérations sont conservés. Les autres tableaux gardent leur structure sémantique, avec des lignes espacées et arrondies sans quadrillage. Les listes de publications, alertes et services suivent la même présentation aérée. Les boutons secondaires ont un fond doux, sans bordure décorative ; focus, champs et statuts restent identifiables, et le contraste élevé rétablit les contours utiles.

Les champs de saisie et sélecteurs de l’admin ont une hauteur `h-10` et un arrondi `rounded-2xl`. Les zones de texte gardent leur hauteur multiligne avec le même arrondi et une hauteur minimale de 2,5 rem. Les contours sont discrets ; le focus clavier, les erreurs et le contraste élevé restent visibles.

## Espaces et frontières

Les trois modules sont des rubriques de l’application `admin`, pas des espaces IAM ni des permissions d’opération. Le fournisseur IAM et les contrôles serveur existants gardent autorité. La liste actuelle des modules ne fournit pas de capacités détaillées par rubrique : un écran peut encore afficher un refus explicite selon les droits, comme avant la refonte.

Le module Auth définit le port `CitizenWorkspaceProvider.isAvailable(): Promise<boolean>` et l’erreur contractuelle `CitizenWorkspaceUnavailableError`. Le module fournisseur `citizen-accounts` l’implémente dans son Infrastructure (`HttpCitizenWorkspaceProvider`) en lisant `GET /api/citizen/me` avec la session courante. Aucun profil ni entité ne traverse ce port. Le kernel injecte l’adaptateur ; le cas d’usage Auth et RTK Query alimentent le menu.

Pendant la vérification des espaces à l’ouverture du menu du compte, seule la ligne en cours de chargement affiche un skeleton. L’identité, l’espace Administration et la déconnexion restent affichés ; une annonce discrète est disponible aux lecteurs d’écran.

- `200` : accès citoyen affiché ; `404` : accès masqué.
- `401` : session invalidée et caches vidés.
- Refus, panne réseau ou erreur serveur : message et « Réessayer », sans déconnexion et sans présenter cette erreur comme une absence de profil.

Le lien Citoyen revient vers `/espace/` du site configuré par `VITE_SITE_URL`, en utilisant la session du site existante. Aucun JWT ne passe dans l’URL ni dans le stockage d’une autre application. Si cette session n’existe plus, le site demande une connexion. Le protocole site → admin et la déconnexion locale sont inchangés.

## Composition et validation

`app/backoffice-layout.tsx` compose les données Auth, le menu du compte et l’UI du socle. `workspace-navigation.ts` décrit le routage visuel ; `AdminContent` conserve le titre de document, le lien d’évitement et le focus sur le titre après navigation. Les anciennes enveloppes propres à chaque module ont été remplacées par cette enveloppe commune.

Tests automatisés : couverture des routes de navigation et du fournisseur d’accès citoyen (succès, absence, expiration, refus, panne). Validation finale : build et lint réussis, 44 tests admin réussis (dont 9 nouveaux). Le build signale un bundle JavaScript supérieur à 500 kB ; son découpage reste hors de cette refonte. Recette visuelle ordinateur/mobile et lecteur d’écran encore à réaliser.

<!-- backlinks:start -->
---

[← Retour à admin](README.md)

**Référencé depuis :**

- [Admin](README.md)
- [Consignes admin](../AGENTS.md)
- [Chantier](../../../../doc/chantier/README.md)
<!-- backlinks:end -->
