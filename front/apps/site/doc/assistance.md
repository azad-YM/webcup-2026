# Assistance aux habitants (L22)

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Site](README.md) › Assistance
<!-- navigation:end -->

Parcours livrés au lot L22 (non testés, non vérifiés dans un navigateur). Backend : [BC Assistance](../../../../api/src/Assistance/doc/README.md) ; décision : [ADR 011](../../../../doc/technique/decisions/011-bc-assistance.md).

## Trouver un service (D10)

`/services` (et la recherche de l’accueil qui y mène) : après une courte pause de saisie, l’API classe les services de façon tolérante (`useSearchServicesQuery`) ; en attendant ou en cas de panne, le filtre exact local reste utilisé. « Vous vouliez dire : … » corrige une faute de frappe. Si le modèle est disponible, Entrée ou « Chercher avec l’assistant » lance la recherche assistée (reformulation affichée, origine IA indiquée) ; elle est tentée automatiquement une fois quand aucun service n’est trouvé. Toujours une issue : décrire son besoin à l’assistant (`/aide/assistant?q=…`), contacter la mairie, urgences, nouvel arrivant. L’en-tête n’a pas de champ de recherche : rien n’y a été branché.

## Assistant d’orientation (F91, F92)

Bouton flottant « Besoin d’aide ? » sur toutes les pages (sauf `/aide/assistant`) et page `/aide/assistant`. Module `assistance` : port `OrientationGateway`, `assistanceApi` (mutation `orient`). La conversation est chargée à la première ouverture (`React.lazy`), reste en mémoire de la page (rien dans le navigateur ni sur le serveur), 4 questions au plus. Journal `role="log"`, Entrée envoie, Maj+Entrée va à la ligne, Échap ferme le panneau et rend le focus au bouton ; mise en page en propriétés logiques (arabe de droite à gauche) ; textes fr/en/ar. Chaque réponse indique son origine (IA ou réponse simple sans IA) ; une urgence affiche « Appeler le 15 / 112 » en tête.

## Expliquer simplement (F90) et version en clair (F89)

Composants du module `public` : `ExplainSimply` (bouton discret sous la description et les démarches d’une fiche service, et sous chaque paragraphe d’une actualité) et `PlainLanguageSwitch` (interrupteur « Version en langage clair » qui affiche en premier la version validée par la mairie, si elle existe). Sans modèle, l’explication montre la version en clair validée et les définitions des mots difficiles (lexique de l’API et [glossaire](../src/modules/public/ui/pages/glossary.tsx)). La saisie de la version en clair se fait dans l’[admin](../../admin/doc/README.md) (services et publications).

<!-- backlinks:start -->
---

[← Retour au site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Assistance](../../../../api/src/Assistance/doc/README.md)
<!-- backlinks:end -->
