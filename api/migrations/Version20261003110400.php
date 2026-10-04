<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261003110400 extends AbstractMigration
{
    /** Snapshot of all 71 requests reviewed in doc/chantier/demandes.md on 2026-10-03. */
    private const TRACKING = [
        ['D01', 'in_progress', 'L1 — 🟡 API (POST /api/citizen/register) et site (inscription en 2 étapes, espace) livrés ; bout en bout à vérifier dans le navigateur'],
        ['D03', 'in_progress', 'L1 — 🟡 connexion et espace /espace livrés (API GET /api/citizen/me + site) ; bout en bout à vérifier dans le navigateur'],
        ['D04', 'in_progress', 'L2 — 🟡 « Contacter la mairie » (site) sur POST /api/citizen/requests (Citizen) ; ni testé ni vérifié dans le navigateur'],
        ['D05', 'in_progress', 'L3 — 🟡 catalogue et fiches servis par l’API d’Administration, gestion dans l’admin ; non vérifié dans un navigateur, sans test'],
        ['D06', 'in_progress', 'L3 — 🟡 actualités servies par l’API de Communication, publication par les agents dans l’admin ; non vérifié dans un navigateur, sans test'],
        ['D07', 'in_progress', 'L3 — 🟡 accueil structuré branché sur l’API (services mis en avant, dernières actualités) ; non vérifié dans un navigateur'],
        ['D08', 'in_progress', 'L1 — 🟡 les trois profils existent : citoyen (API Citizen + espace du site), « Agent municipal » et « Administrateur principal » (rôles, liste et ajout des membres dans l’admin) ; à vérifier dans le navigateur'],
        ['D09', 'done', 'L1 — ✅ chaque outil de l’admin (rôles, membres, flux Nova Terra) exige sa permission côté serveur, testé ; refus 403 expliqué dans l’interface. À étendre aux outils des lots suivants'],
        ['D19', 'in_progress', 'L6 — 🟡 page « Flux Nova Terra » (/pilotage) sur la route GET /api/pilotage/webcup-feed, testée avec l’API du concours simulée ; ✅ dès qu’elle est vérifiée avec la vraie clé dans api/.env.local'],
        ['F22', 'in_progress', 'L2 — 🟡 module « Demandes citoyennes » de l’admin (file des agents), filtre par état, traitement avec commentaire, temps réel ; ni testé ni vérifié dans le navigateur'],
        ['F21', 'in_progress', 'L4 — 🟡 repères, champs et erreurs reliés, annonces, focus après navigation (site et admin) — site, admin ; non vérifié dans un navigateur'],
        ['F23', 'in_progress', 'L4 — 🟡 palette AA, mode contraste élevé (panneau « Affichage ») — site, admin ; non vérifié'],
        ['F24', 'in_progress', 'L4 — 🟡 taille du texte 100/125/150 % en rem, sans flash — site, admin ; non vérifié'],
        ['D11', 'in_progress', 'L2 — 🟡 « Mes demandes » : état et chronologie des étapes horodatées (/espace/demandes?ref=…) ; ni testé ni vérifié dans le navigateur'],
        ['D12', 'in_progress', 'L4 — 🟡 guide de première visite en 3 étapes sur /espace, masquable et mémorisé — site ; non vérifié'],
        ['D14', 'todo', 'L5 — Choisir une autre langue pour l’interface : à construire ; aucune réalisation complète identifiée.'],
        ['D15', 'in_progress', 'L4 — 🟡 site : toutes les pages hors accueil ; admin : fil calculé depuis l’adresse — site, admin ; non vérifié'],
        ['D16', 'in_progress', 'L2 — 🟡 écran de confirmation avec la référence NT-AAAA-NNNN juste après l’envoi ; ni testé ni vérifié dans le navigateur'],
        ['D17', 'in_progress', 'L2 — 🟡 badge « N en attente » (pendingCount) dans la file de l’admin, mis à jour en temps réel ; ni testé ni vérifié dans le navigateur'],
        ['F25', 'in_progress', 'L2 — 🟡 « Signaler un problème » avec description et lieu obligatoire ; ni testé ni vérifié dans le navigateur'],
        ['F26', 'in_progress', 'L2 — 🟡 historique des demandes dans /espace/demandes ; ni testé ni vérifié dans le navigateur'],
        ['F27', 'todo', 'L5 — Contenus des services et démarches proposés en plusieurs langues : à construire ; aucune réalisation complète identifiée.'],
        ['F28', 'in_progress', 'L3 — 🟡 « Services les plus demandés » selon la mise en avant gérée par les agents ; non vérifié dans un navigateur'],
        ['D18', 'in_progress', 'L7 — 🟡 alertes (gravité, validité) créées dans l’admin, bandeau du site mis à jour en temps réel ; non vérifié dans un navigateur, sans test'],
        ['F29', 'in_progress', 'L7 — 🟡 alerte ciblée par quartier (liste fermée), visible des citoyens du quartier (bandeau, notifications, temps réel) ; non vérifié dans un navigateur'],
        ['F30', 'in_progress', 'L7 — 🟡 annonce importante signalée dans les notifications de l’espace citoyen, en temps réel ; non vérifié dans un navigateur'],
        ['F31', 'in_progress', 'L7 — 🟡 alertes sanitaires avec recommandations rédigées à la main, réservées aux citoyens qui ont consenti ; non vérifié dans un navigateur'],
        ['F32', 'in_progress', 'L3 — 🟡 recherche et filtre par thème sur /services (et ?q=, ?category= côté API) ; non vérifié dans un navigateur'],
        ['F33', 'in_progress', 'L8 — 🟡 livré (règles), non vérifié dans un navigateur'],
        ['F34', 'in_progress', 'L8 — 🟡 livré (page), non vérifié dans un navigateur'],
        ['F35', 'in_progress', 'L4 — 🟡 astuces refermables (services, nouvelle demande), vues une fois — site ; non vérifié'],
        ['F36', 'in_progress', 'L9 — 🟡 horaires et informations des transports sur la fiche des services de mobilité, saisis dans l’admin ; non vérifié dans un navigateur'],
        ['F37', 'in_progress', 'L8 — 🟡 livré (règles, journal), non vérifié dans un navigateur'],
        ['F38', 'in_progress', 'L9 — 🟡 état du service (disponible, maintenance, incident), message, retour prévu et alternative sur la carte et la fiche ; non vérifié dans un navigateur'],
        ['F39', 'in_progress', 'L10 — 🟡 créneaux ouverts par les agents, réservation, déplacement et annulation dans /espace/rendez-vous ; confirmation avec lieu, consignes et fuseau ; ni testé ni vérifié dans le navigateur'],
        ['F40', 'in_progress', 'L10 — 🟡 rappels persistés et temps réel (veille et 2 h avant), commande app:appointments:remind ; planification du cron et réception à vérifier ; non testé'],
        ['D13', 'in_progress', 'L4 — 🟡 libellés simplifiés, erreurs techniques traduites, glossaire /aide/glossaire — site, admin ; non vérifié'],
        ['D20', 'in_progress', 'L4 — 🟡 réglages intégrés aux mêmes pages, pas de parcours à part — site, admin ; non vérifié'],
        ['F41', 'in_progress', 'L4 — 🟡 focus toujours visible, liens d’évitement site et admin, dialogues piégés avec Échap, retour du focus — site, admin ; non vérifié'],
        ['F42', 'in_progress', 'L4 — 🟡 label, aria-describedby, aria-invalid, erreurs annoncées et reliées (site et admin) — site, admin ; non vérifié'],
        ['F43', 'in_progress', 'L4 — 🟡 StatusBadge icône + libellé + bordure, liens soulignés — site, admin ; non vérifié'],
        ['F44', 'in_progress', 'L4 — 🟡 mise en page fluide à 200 % / 320 px, en-tête non collant au besoin — site, admin ; non vérifié'],
        ['F45', 'todo', 'L11 — Localiser les services physiques de la ville (carte, adresse, itinéraire) : à construire ; aucune réalisation complète identifiée.'],
        ['F46', 'todo', 'L11 — Trouver rapidement hôpitaux et services d’urgence : à construire ; aucune réalisation complète identifiée.'],
        ['F47', 'in_progress', 'L12 — 🟡 journal des actions (BC Audit, GET /api/audit/entries, écran /admin/journal, filtres acteur/action/période/recherche) ; non testé, non vérifié dans un navigateur'],
        ['F48', 'in_progress', 'L12 — 🟡 acteur, date, cible et détail de chaque action de l’administration (journal) ; non testé'],
        ['F49', 'in_progress', 'L2 — 🟡 centre « Mes notifications » de /espace, bandeau et pastille, temps réel notification.created (Citizen) ; ni testé ni vérifié dans le navigateur'],
        ['F50', 'in_progress', 'L13 — 🟡 /pilotage/tableau-de-bord sur GET /api/pilotage/activity (chiffres des BC propriétaires par ports, relecture 60 s) ; non testé, non vérifié dans un navigateur'],
        ['F51', 'in_progress', 'L14 — 🟡 page /vos-donnees, inquiétudes avec accusé INQ-… et suivi (participation) ; ni testé ni vérifié dans le navigateur'],
        ['F52', 'in_progress', 'L14 — 🟡 signalements publics et soutien unique par habitant (participation) ; ni testé ni vérifié dans le navigateur'],
        ['D02', 'todo', 'L15 — Se connecter sans mot de passe classique, avec un haut niveau de sécurité et un parcours compréhensible : à construire ; aucune réalisation complète identifiée.'],
        ['F53', 'todo', 'L15 — Vérification supplémentaire pour sécuriser les comptes citoyens : à construire ; aucune réalisation complète identifiée.'],
        ['F54', 'todo', 'L15 — Être prévenu d’une connexion à son compte depuis un nouvel appareil : à construire ; aucune réalisation complète identifiée.'],
        ['F55', 'todo', 'L16 — Récupérer les informations personnelles que la ville possède sur soi, sous une forme claire et exploitable : à construire ; aucune réalisation complète identifiée.'],
        ['F56', 'todo', 'L16 — Télécharger un récapitulatif lisible de ses demandes : à construire ; aucune réalisation complète identifiée.'],
        ['F57', 'todo', 'L17 — Évaluer la performance environnementale du site et l’alléger : à construire ; aucune réalisation complète identifiée.'],
        ['F58', 'todo', 'L17 — Appliquer des choix de conception et de chargement sobres sur les principaux parcours : à construire ; aucune réalisation complète identifiée.'],
        ['F59', 'todo', 'L17 — Rester utilisable avec une connexion très lente : à construire ; aucune réalisation complète identifiée.'],
        ['F60', 'todo', 'L17 — Images et médias qui n’alourdissent pas inutilement les pages : à construire ; aucune réalisation complète identifiée.'],
        ['F61', 'todo', 'L17 — Rester rapide sur des appareils peu puissants : à construire ; aucune réalisation complète identifiée.'],
        ['F62', 'todo', 'L17 — Version plus simple et plus rapide de certaines pages : à construire ; aucune réalisation complète identifiée.'],
        ['F63', 'in_progress', 'L18 — ⚠️ état maintenance/incident modifiable dans l’admin ; désactivation effective des démarches et réservations non implémentée'],
        ['F64', 'in_progress', 'L18 — 🟡 état, message, retour prévu et alternative déjà visibles sur les cartes et fiches des services (L9/F38) ; non vérifié dans le navigateur'],
        ['F65', 'todo', 'L19 — Soumettre certaines décisions à l’avis des habitants, avec trace de la contribution : à construire ; aucune réalisation complète identifiée.'],
        ['F66', 'todo', 'L19 — Donner son avis sur un projet sans vote officiel, et savoir qu’il est enregistré : à construire ; aucune réalisation complète identifiée.'],
        ['F67', 'todo', 'L19 — Consulter les projets en cours dans la ville : à construire ; aucune réalisation complète identifiée.'],
        ['F68', 'todo', 'L19 — Proposer des idées pour améliorer la colonie : à construire ; aucune réalisation complète identifiée.'],
        ['F69', 'todo', 'L20 — Protéger les données sensibles contre l’exploitation d’une faille, de façon perceptible sans compliquer l’usage : à construire ; aucune réalisation complète identifiée.'],
        ['F70', 'todo', 'L20 — Réserver strictement certaines données administratives aux agents autorisés : à construire ; aucune réalisation complète identifiée.'],
        ['F71', 'todo', 'L21 — Accueillir des habitants sans adresse e-mail et ne parlant pas tous la même langue : à construire ; aucune réalisation complète identifiée.'],
        ['F72', 'in_progress', 'L21 — ⚠️ guide « Par où commencer ? » et raccourcis déjà présents dans /espace (L4/D12), sans refaire l’inscription ; guide masquable, réouverture non proposée ; parcours nouvel arrivant à vérifier'],
    ];

    public function getDescription(): string
    {
        return 'Synchronize all 71 chantier requests into Pilotage, preserving manual tracking.';
    }

    public function up(Schema $schema): void
    {
        foreach (self::TRACKING as [$code, $status, $note]) {
            // Only the untouched original seed may be replaced. Never overwrite an agent's work.
            $this->addSql(
                "UPDATE pilotage_request_tracking SET status = ?, note = ?, updated_at = UTC_TIMESTAMP() WHERE request_code = ? AND updated_by_id IS NULL AND updated_by_name = 'Registre du chantier' AND note = 'Pré-rempli depuis le registre du chantier.' AND JSON_LENGTH(links) = 0",
                [$status, $note, $code],
            );
            $this->addSql(
                "INSERT INTO pilotage_request_tracking (request_code, status, links, note, updated_at, updated_by_id, updated_by_name) SELECT ?, ?, '[]', ?, UTC_TIMESTAMP(), NULL, 'Registre du chantier' WHERE NOT EXISTS (SELECT 1 FROM pilotage_request_tracking WHERE request_code = ?)",
                [$code, $status, $note, $code],
            );
        }
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Tracking may have been edited by agents since synchronization.');
    }
}
