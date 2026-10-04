<?php

declare(strict_types=1);

namespace Assistance\Domain\Language;

/**
 * Mots administratifs difficiles et leur équivalent simple (F89, F90, D13).
 * Sert au repli local : définitions des mots repérés dans un passage, et brouillon « En clair » sans modèle.
 * Le glossaire du site (`/aide/glossaire`) explique les mots du portail ; ce lexique couvre les mots des fiches.
 */
final class PlainLexicon
{
    /** @var array<string, array{0: string, 1: string}> mot (forme affichée) => [équivalent simple, définition] */
    private const ENTRIES = [
        'justificatif de domicile' => ['preuve d’adresse', 'Un papier récent qui montre où vous habitez : facture d’eau ou d’électricité, quittance de loyer.'],
        'justificatif' => ['papier qui prouve', 'Un document qui prouve ce que vous dites (adresse, identité, revenus).'],
        'pièce d’identité' => ['carte d’identité ou passeport', 'Un document officiel avec votre photo : carte d’identité, passeport ou titre de séjour.'],
        'état civil' => ['naissances, mariages et décès', 'Le service qui enregistre les naissances, les mariages et les décès, et délivre les actes.'],
        'acte de naissance' => ['papier officiel de naissance', 'Le document officiel qui prouve votre naissance (date, lieu, parents).'],
        'recensement' => ['comptage des habitants', 'L’inscription des habitants auprès de la mairie, pour compter la population ou pour les jeunes à 16 ans.'],
        'domiciliation' => ['adresse pour recevoir le courrier', 'Une adresse donnée par la mairie ou une association pour recevoir votre courrier si vous n’avez pas de logement stable.'],
        'délivrance' => ['remise', 'Le moment où la mairie vous remet un document.'],
        'délivrer' => ['remettre', 'Donner officiellement un document.'],
        'formulaire' => ['fiche à remplir', 'Une fiche avec des cases à remplir.'],
        'démarche' => ['étape à faire', 'Ce qu’il faut faire auprès de la mairie pour obtenir quelque chose.'],
        'téléservice' => ['démarche en ligne', 'Une démarche que l’on fait sur internet, sans se déplacer.'],
        'guichet' => ['accueil', 'L’endroit où un agent vous reçoit.'],
        'usager' => ['habitant', 'La personne qui utilise un service public.'],
        'administré' => ['habitant', 'Une personne qui habite la commune.'],
        'pièces justificatives' => ['papiers à apporter', 'Les documents demandés pour prouver votre situation.'],
        'attribution' => ['choix du bénéficiaire', 'La décision de donner (un logement, une aide) à une personne.'],
        'éligible' => ['qui y a droit', 'Qui remplit les conditions pour obtenir une aide ou un service.'],
        'bénéficiaire' => ['personne qui reçoit', 'La personne qui reçoit une aide ou un service.'],
        'quotient familial' => ['calcul selon vos revenus', 'Un calcul qui tient compte de vos revenus et du nombre de personnes du foyer, pour fixer certains prix.'],
        'foyer' => ['personnes qui vivent avec vous', 'Toutes les personnes qui vivent dans le même logement.'],
        'périscolaire' => ['avant et après l’école', 'L’accueil des enfants avant et après la classe, et le mercredi.'],
        'encombrants' => ['gros objets', 'Les gros objets dont on se débarrasse : meubles, électroménager, matelas.'],
        'collecte' => ['ramassage', 'Le passage du camion qui ramasse les déchets.'],
        'voirie' => ['rues et trottoirs', 'Les rues, les routes et les trottoirs de la ville.'],
        'signalement' => ['message pour prévenir d’un problème', 'Un message pour prévenir la mairie d’un problème dans la ville.'],
        'interruption' => ['arrêt', 'Le service s’arrête pendant un moment.'],
        'perturbation' => ['difficulté', 'Le service marche moins bien que d’habitude.'],
        'modalités' => ['comment faire', 'La façon de faire une démarche.'],
        'préalable' => ['avant', 'Ce qui doit être fait avant.'],
        'en vigueur' => ['actuel', 'Qui s’applique en ce moment.'],
        'conformément à' => ['selon', 'En suivant une règle.'],
        'subvention' => ['aide en argent', 'Une somme d’argent donnée par la ville pour aider un projet.'],
        'redevance' => ['somme à payer', 'Une somme payée pour un service.'],
        'exonération' => ['dispense de payer', 'Vous n’avez pas à payer.'],
        'dérogation' => ['exception', 'Une autorisation de ne pas suivre la règle habituelle.'],
        'consultation' => ['avis demandé aux habitants', 'La ville demande l’avis des habitants avant de décider.'],
        'arrêté' => ['décision écrite du maire', 'Une décision officielle du maire (par exemple une rue fermée).'],
        'mairie annexe' => ['petite mairie de quartier', 'Un bureau de la mairie dans un quartier.'],
        'CCAS' => ['service d’aide sociale', 'Le centre communal d’action sociale : il aide les personnes en difficulté.'],
        'téléconsultation' => ['rendez-vous médical par écran', 'Une consultation avec un médecin à distance, par vidéo.'],
        'ordonnance' => ['papier du médecin pour les médicaments', 'Le papier signé par le médecin qui indique vos médicaments.'],
        'abonnement' => ['forfait', 'Un contrat payé chaque mois ou chaque année pour utiliser un service.'],
    ];

    /**
     * Mots difficiles présents dans le passage, dans l'ordre du lexique (plus longues expressions d'abord).
     *
     * @return list<array{term: string, simple: string, definition: string}>
     */
    public static function find(string $text, int $limit = 6): array
    {
        $folded = ' '.preg_replace('/[^\p{L}\p{N}]+/u', ' ', TextFolding::fold($text)).' ';
        $found = [];
        foreach (self::sorted() as $term => [$simple, $definition]) {
            $needle = ' '.trim((string) preg_replace('/[^\p{L}\p{N}]+/u', ' ', TextFolding::fold($term))).' ';
            $plural = rtrim($needle).'s ';
            if (str_contains($folded, $needle) || str_contains($folded, $plural)) {
                $found[] = ['term' => $term, 'simple' => $simple, 'definition' => $definition];
                $folded = str_replace([$needle, $plural], ' ', $folded);
                if (count($found) >= $limit) {
                    break;
                }
            }
        }

        return $found;
    }

    /**
     * Ajoute l'équivalent simple entre parenthèses après la première occurrence de chaque mot difficile
     * (brouillon local « En clair ») : le mot officiel reste, la phrase reste correcte.
     */
    public static function simplify(string $text): string
    {
        $placeholders = [];
        foreach (self::sorted() as $term => [$simple]) {
            $text = (string) preg_replace_callback(
                '/(?<![\p{L}])'.strtr(preg_quote($term, '/'), ['’' => '[’\']', "'" => '[’\']']).'s?(?![\p{L}])/iu',
                function (array $match) use ($simple, &$placeholders): string {
                    $placeholders[] = $match[0].' ('.$simple.')';

                    return "\u{E000}".(count($placeholders) - 1)."\u{E001}";
                },
                $text,
                1,
            );
        }

        return (string) preg_replace_callback("/\u{E000}(\\d+)\u{E001}/u", fn (array $match) => $placeholders[(int) $match[1]], $text);
    }

    /** @return array<string, array{0: string, 1: string}> */
    private static function sorted(): array
    {
        $entries = self::ENTRIES;
        uksort($entries, fn (string $a, string $b) => mb_strlen($b) <=> mb_strlen($a));

        return $entries;
    }
}
