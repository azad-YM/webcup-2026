# Environnements

<!-- navigation:start -->
[Accueil du projet](../../../../README.md) › [Documentation](../../../../doc/README.md) › [Shared](README.md) › Environnements
<!-- navigation:end -->


## Environnements prévus

- `development` pour le travail local ;
- `demo` pour les démonstrations fonctionnelles ;
- `preproduction` pour les validations avant livraison ;
- `production` comme cible à sécuriser et documenter.

Le dépôt fournit actuellement des compositions Docker pour le développement, la démonstration, la préproduction et le reverse proxy. La stratégie de production, de sauvegarde, de restauration, de supervision et de gestion des secrets reste à formaliser.

## Services locaux

L’environnement de développement assemble le site, l’admin, l’API, Nginx, MySQL et un worker Messenger. Les adresses utiles figurent dans le [README principal](../../../../README.md).

La production de concours est un hébergement cPanel sans Docker : voir le [déploiement cPanel](../../../../doc/technique/deploiement-cpanel.md).

## Points à définir avant production

- fournisseur et région d'hébergement ;
- exigences de disponibilité et objectifs de reprise ;
- conservation, chiffrement et localisation des données ;
- rotation des secrets et certificats ;
- sauvegardes et tests de restauration ;
- centralisation des logs, métriques et alertes ;
- procédure de déploiement et de retour arrière.

<!-- backlinks:start -->
---

[← Retour à Shared](README.md)
<!-- backlinks:end -->
