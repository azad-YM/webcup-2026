<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L28 (F99) : offres des partenaires (ce qui est proposé, disponibilité, prochaine action).
 * Contenu de démonstration pour les trois associations de `Version20261004130300` et celle du jeu de démo.
 */
final class Version20261004140200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Administration: partner offers with availability and next action (F99).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service ADD offers JSON DEFAULT NULL');
        foreach (self::offers() as $id => $offers) {
            $this->addSql("UPDATE municipal_service SET offers = ? WHERE id = ? AND category = 'partenaires'", [json_encode($offers, JSON_UNESCAPED_UNICODE), $id]);
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service DROP offers');
    }

    /** @return array<string, list<array<string, mixed>>> */
    private static function offers(): array
    {
        $offer = static fn (int $n, string $title, string $description, string $audience, string $status, string $note, ?int $inDays, string $kind, string $label, string $target = ''): array => [
            'id' => 'offre-'.$n, 'title' => $title, 'description' => $description, 'audience' => $audience, 'status' => $status, 'statusNote' => $note,
            'nextAvailableAt' => $inDays === null ? null : (new \DateTimeImmutable(sprintf('+%d days', $inDays)))->setTime(9, 0)->format(DATE_ATOM),
            'action' => ['kind' => $kind, 'label' => $label, 'target' => $target],
        ];

        return [
            'association-entraide-aurore' => [
                $offer(1, 'Colis alimentaire', 'Un colis de produits de base pour une semaine, sans avance de frais.', 'Familles et personnes seules aux revenus modestes', 'available', 'Sans rendez-vous aux heures d’ouverture', null, 'visit', 'Venir à la Maison des associations'),
                $offer(2, 'Vestiaire solidaire', 'Vêtements et chaussures pour enfants et adultes, à petit prix.', 'Tous les habitants', 'limited', 'Peu de tailles enfant en ce moment', null, 'visit', 'Passer au vestiaire'),
                $offer(3, 'Accompagnement aux démarches', 'Un bénévole vous aide à remplir un dossier ou une demande en ligne.', 'Toute personne qui a besoin d’aide', 'full', 'Complet cette semaine', 4, 'call', 'Appeler pour la semaine prochaine', '01 00 00 20 10'),
            ],
            'association-jardins-partages' => [
                $offer(1, 'Parcelle partagée sous serre', 'Une parcelle de 4 m² pour cultiver vos légumes, outils fournis.', 'Foyers habitant la ville', 'full', 'Liste d’attente : environ 3 semaines', 21, 'register', 'S’inscrire sur la liste d’attente', 'https://jardins-partages.example'),
                $offer(2, 'Atelier compostage', 'Apprendre à composter ses déchets de cuisine, en 1 h 30.', 'Tous, enfants accompagnés bienvenus', 'available', 'Chaque samedi à 10 h, 8 places restantes', null, 'book', 'Réserver une place', 'https://jardins-partages.example'),
                $offer(3, 'Échange de graines', 'Déposez et emportez des graines adaptées aux serres.', 'Tous les habitants', 'paused', 'Suspendu pendant l’inventaire de la grainothèque', 10, 'email', 'Être prévenu de la reprise', 'bonjour@jardins-partages.example'),
            ],
            'association-lire-ensemble' => [
                $offer(1, 'Aide aux devoirs', 'Accompagnement individuel après l’école, du CP à la 3e.', 'Enfants scolarisés', 'limited', '2 places restantes le mardi et le jeudi', null, 'call', 'Appeler pour inscrire votre enfant', '01 00 00 20 30'),
                $offer(2, 'Apprendre à lire et écrire le français', 'Ateliers en petit groupe, à votre rythme.', 'Adultes, débutants acceptés', 'available', 'Inscription toute l’année', null, 'visit', 'Venir à la médiathèque centrale'),
                $offer(3, 'Atelier d’écriture', 'Écrire et partager des textes sur la vie à Nova Terra.', 'Adolescents et adultes', 'soon', 'Nouvelle session en préparation', 14, 'email', 'Demander à être inscrit', 'lire-ensemble@example.org'),
            ],
            'serres-partagees' => [
                $offer(1, 'Panier solidaire', 'Un panier de légumes des serres chaque semaine, prix adapté aux revenus.', 'Foyers aux revenus modestes', 'available', 'Retrait le samedi de 9 h à 12 h', null, 'visit', 'Venir aux Serres du Sud'),
                $offer(2, 'Parcelle hydroponique', 'Louer une parcelle hydroponique pour la saison.', 'Foyers du quartier Sud en priorité', 'full', 'Toutes les parcelles sont attribuées', 30, 'website', 'Voir les prochaines attributions', 'https://serres-nova.example'),
            ],
        ];
    }
}
