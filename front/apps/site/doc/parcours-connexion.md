# Parcours de connexion et d’accès aux espaces

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Parcours de connexion
<!-- navigation:end -->

Les contrats et contrôles serveur appartiennent à [IAM](../../../../api/src/IAM/doc/comptes-et-sessions.md). L’inscription et l’espace citoyen sont décrits dans le [parcours citoyen](parcours-citoyen.md).

## 1. Arriver sur le site

L’accueil `/` est public. L’en-tête propose « Connexion » et « Créer un compte » aux visiteurs, « Mon espace » et « Déconnexion » aux personnes connectées. La présence d’un jeton ne prouve pas les accès : ce sont les appels à l’API (espaces, profil citoyen) qui valident la session.

## 2. Se connecter

`/connexion` appelle le cas d’usage de connexion ; IAM vérifie les identifiants et retourne le JWT, sauvegardé via `AuthSessionGateway`, puis redirection vers `/espace` ou vers la page demandée (`?retour=/espace/profil`, liste fermée de destinations). Erreur compréhensible en cas d’identifiants incorrects ; soumissions répétées bloquées ; nouvelle tentative possible après une panne, saisie conservée.

`/login` reste disponible : l’admin y renvoie encore ses utilisateurs non connectés. La page redirige vers `/connexion` en conservant les paramètres.

## 3. Choisir un espace

Les espaces IAM s’affichent dans `/espace` : section « Vos espaces de travail » pour un citoyen qui en possède, ou sous le message « ce compte n’est pas un compte citoyen » pour un compte d’agent.

| Résultat | Comportement |
|---|---|
| Un ou plusieurs espaces | Afficher uniquement les cartes autorisées, avec les rôles. Une carte unique reste sélectionnable, sans redirection automatique. |
| Aucun espace | Compte non citoyen : état « aucun espace de travail disponible », session conservée. Citoyen : rien n’est affiché. |
| 401 | Nettoyer la session et les caches, puis proposer de se reconnecter. |
| Erreur temporaire | Message et bouton « Réessayer », sans déconnexion. |

## 4. Rejoindre l’admin

1. La carte « Administration » ouvre `/auth/start` de l’admin dans un nouvel onglet.
2. L’admin génère état + vérificateur et rejoint `/sso` du site avec l’état et le challenge.
3. Le site demande un code à IAM pour la destination `admin` (sans session : renvoi vers `/connexion`).
4. Il redirige vers le callback configuré de l’admin avec le code et l’état — jamais un JWT.
5. L’admin vérifie l’état, échange le code avec le vérificateur, enregistre sa session et vérifie son accès.

Une erreur permet de revenir à `/espace` et de recommencer.

## 5. Accès direct et déconnexion

L’admin n’a pas de formulaire : sans session, elle renvoie vers le site ; sans accès, elle affiche un refus. « Déconnexion » nettoie la session locale et les caches du site, puis revient à l’accueil ; la révocation commune reste à livrer.

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Site](README.md)
- [Architecture technique](../../../../doc/technique/architecture.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
- [Admin](../../admin/doc/README.md)
<!-- backlinks:end -->
