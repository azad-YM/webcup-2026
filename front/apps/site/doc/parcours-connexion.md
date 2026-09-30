# Parcours de connexion et d’accès aux espaces

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [site](README.md) › Parcours de connexion
<!-- navigation:end -->

Les contrats et contrôles serveur appartiennent à [IAM](../../../../api/src/IAM/doc/comptes-et-sessions.md).

## 1. Arriver sur le site

L’accueil `/` est public. Sans session, le site affiche son contenu et un lien vers `/login` ; la liste des espaces invite également à se connecter sans appeler l’API. Avec une session, la liste des espaces est demandée : c’est elle qui valide la session côté serveur.

## 2. Se connecter

`/login` appelle le cas d’usage de connexion ; IAM vérifie les identifiants et retourne le JWT, sauvegardé via `AuthSessionGateway`, puis redirection vers `/`. Erreur compréhensible en cas d’identifiants incorrects ; soumissions répétées bloquées ; nouvelle tentative possible après une panne.

## 3. Choisir un espace

| Résultat | Comportement |
|---|---|
| Un ou plusieurs espaces | Afficher uniquement les cartes autorisées, avec les rôles. |
| Aucun espace | État « aucun espace disponible », session conservée. |
| 401 | Nettoyer la session et le cache, puis proposer de se reconnecter depuis l’accueil. |
| Erreur temporaire | Message et bouton « Réessayer », sans déconnexion. |

## 4. Rejoindre l’admin

1. La carte « Administration » ouvre `/auth/start` de l’admin dans un nouvel onglet.
2. L’admin génère état + vérificateur et rejoint `/sso` du site avec l’état et le challenge.
3. Le site demande un code à IAM pour la destination `admin`.
4. Il redirige vers le callback configuré de l’admin avec le code et l’état — jamais un JWT.
5. L’admin vérifie l’état, échange le code avec le vérificateur, enregistre sa session et vérifie son accès.

Une erreur permet de revenir au site et de recommencer.

## 5. Accès direct et déconnexion

L’admin n’a pas de formulaire : sans session, elle renvoie vers le site ; sans accès, elle affiche un refus. La déconnexion nettoie la session locale de l’application concernée ; la révocation commune reste à livrer.

<!-- backlinks:start -->
---

[← Retour à site](README.md)

**Référencé depuis :**

- [Architecture technique](../../../../doc/technique/architecture.md)
- [IAM](../../../../api/src/IAM/doc/README.md)
- [Admin](../../admin/doc/README.md)
<!-- backlinks:end -->
