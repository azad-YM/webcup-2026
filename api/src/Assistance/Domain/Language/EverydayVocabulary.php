<?php

declare(strict_types=1);

namespace Assistance\Domain\Language;

/**
 * Mots du quotidien → mots du catalogue (D10). Les habitants écrivent « papiers », « bébé », « poubelles », « bus »
 * ou « malade » ; les fiches parlent d'état civil, de petite enfance, de collecte des déchets, de navettes ou de soins.
 * Les clés et les valeurs sont écrites pliées (sans accents) et au singulier, comme `TextFolding::words()`.
 * Le dictionnaire est indépendant du catalogue : il élargit la recherche sans inventer de service.
 */
final class EverydayVocabulary
{
    /** @var array<string, list<string>> */
    private const SYNONYMS = [
        // Papiers et citoyenneté
        'papier' => ['etat', 'civil', 'acte', 'identite', 'document'],
        'carte' => ['identite', 'papier'],
        'cni' => ['identite', 'papier'],
        'passeport' => ['identite', 'papier'],
        'demenagement' => ['arrivee', 'logement', 'recensement', 'nouveau'],
        'demenage' => ['arrivee', 'logement', 'recensement', 'nouveau'],
        'arrive' => ['arrivee', 'nouveau', 'accueil'],
        'nouveau' => ['arrivee', 'accueil'],
        'vote' => ['election', 'citoyennete'],
        'voter' => ['election', 'citoyennete'],
        'mariage' => ['mariage', 'etat', 'civil'],
        'marier' => ['mariage', 'etat', 'civil'],
        'pacs' => ['mariage', 'etat', 'civil'],
        'mort' => ['deces', 'etat', 'civil'],
        'decede' => ['deces', 'etat', 'civil'],
        'naitre' => ['naissance', 'etat', 'civil'],
        // Famille, enfance
        'bebe' => ['naissance', 'creche', 'enfant', 'petite', 'enfance', 'maternite'],
        'enceinte' => ['maternite', 'naissance', 'hopital', 'medecin'],
        'grossesse' => ['maternite', 'naissance', 'hopital'],
        'gamin' => ['enfant', 'ecole'],
        'gosse' => ['enfant', 'ecole'],
        'fils' => ['enfant', 'ecole', 'famille'],
        'fille' => ['enfant', 'ecole', 'famille'],
        'garderie' => ['creche', 'periscolaire', 'enfant'],
        'nounou' => ['creche', 'enfant'],
        'cantine' => ['cantine', 'ecole'],
        'repas' => ['cantine'],
        'classe' => ['ecole', 'inscription'],
        'college' => ['ecole', 'education'],
        'scolaire' => ['ecole', 'education', 'periscolaire'],
        // Santé
        'malade' => ['sante', 'medecin', 'soin', 'pharmacie'],
        'maladie' => ['sante', 'medecin', 'soin'],
        'docteur' => ['medecin', 'sante'],
        'toubib' => ['medecin', 'sante'],
        'mal' => ['sante', 'medecin', 'soin'],
        'fievre' => ['sante', 'medecin', 'pharmacie'],
        'douleur' => ['sante', 'medecin', 'soin'],
        'blesse' => ['blessure', 'urgence', 'soin'],
        'medicament' => ['pharmacie', 'medicament', 'ordonnance'],
        'cachet' => ['pharmacie', 'medicament'],
        'vaccination' => ['vaccin', 'sante'],
        'piqure' => ['vaccin', 'soin'],
        'dentiste' => ['medecin', 'sante', 'specialiste'],
        // Mobilité
        'bus' => ['navette', 'bus', 'transport', 'horaire'],
        'autobus' => ['navette', 'bus', 'transport'],
        'tram' => ['navette', 'transport'],
        'metro' => ['navette', 'transport'],
        'train' => ['navette', 'transport'],
        'ticket' => ['abonnement', 'transport'],
        'billet' => ['abonnement', 'transport'],
        'arret' => ['navette', 'horaire', 'transport'],
        'voiture' => ['route', 'deplacement', 'mobilite'],
        'velo' => ['deplacement', 'mobilite'],
        'deplacer' => ['deplacement', 'mobilite', 'transport'],
        // Cadre de vie, voirie, propreté
        'poubelle' => ['dechet', 'poubelle', 'collecte', 'proprete'],
        'ordure' => ['dechet', 'poubelle', 'collecte'],
        'detritus' => ['dechet', 'proprete'],
        'sale' => ['proprete', 'dechet'],
        'salete' => ['proprete', 'dechet'],
        'tri' => ['tri', 'recyclage', 'dechet'],
        'trier' => ['tri', 'recyclage'],
        'plastique' => ['tri', 'recyclage'],
        'carton' => ['tri', 'recyclage', 'encombrant'],
        'meuble' => ['encombrant', 'collecte'],
        'canape' => ['encombrant', 'collecte'],
        'frigo' => ['encombrant', 'collecte'],
        'trou' => ['route', 'rue', 'trottoir', 'signalement', 'voirie'],
        'nid' => ['route', 'rue', 'signalement'],
        'chaussee' => ['route', 'rue', 'voirie'],
        'lampe' => ['lampadaire', 'lumiere', 'eclairage'],
        'lumiere' => ['lampadaire', 'eclairage'],
        'eclairage' => ['lampadaire', 'eclairage'],
        'noir' => ['lampadaire', 'eclairage', 'coupure'],
        'casse' => ['panne', 'signalement', 'travaux'],
        'abime' => ['panne', 'signalement', 'travaux'],
        'chantier' => ['travaux'],
        'bruit' => ['signalement', 'travaux', 'police'],
        // Eau, énergie, logement
        'courant' => ['electricite', 'energie', 'coupure'],
        'electrique' => ['electricite', 'energie'],
        'lumineux' => ['electricite'],
        'robinet' => ['eau', 'fuite'],
        'inondation' => ['eau', 'fuite'],
        'chauffage' => ['energie', 'logement'],
        'facture' => ['facture', 'abonnement'],
        'appart' => ['appartement', 'logement'],
        'maison' => ['logement', 'habitat'],
        'loger' => ['logement', 'habitat'],
        'hlm' => ['logement', 'attribution', 'aide'],
        'loyer' => ['loyer', 'logement', 'aide'],
        'proprietaire' => ['logement', 'loyer'],
        'locataire' => ['logement', 'loyer'],
        // Sécurité
        'vole' => ['vol', 'plainte', 'police'],
        'voleur' => ['vol', 'plainte', 'police'],
        'cambriolage' => ['vol', 'plainte', 'police'],
        'agresse' => ['agression', 'police', 'plainte'],
        'feu' => ['incendie', 'pompier', 'secours'],
        'fumee' => ['incendie', 'pompier'],
        // Anglais (interface en anglais)
        'paper' => ['etat', 'civil', 'identite', 'papier'],
        'id' => ['identite', 'papier'],
        'baby' => ['naissance', 'creche', 'enfant'],
        'child' => ['enfant', 'ecole', 'creche'],
        'school' => ['ecole', 'education'],
        'trash' => ['dechet', 'poubelle', 'collecte'],
        'garbage' => ['dechet', 'poubelle', 'collecte'],
        'waste' => ['dechet', 'recyclage'],
        'sick' => ['sante', 'medecin', 'soin'],
        'health' => ['sante', 'medecin', 'soin'],
        'children' => ['enfant', 'ecole', 'creche'],
        'bin' => ['dechet', 'poubelle', 'collecte'],
        'صحة' => ['sante', 'medecin', 'soin'],
        'نقل' => ['transport', 'navette', 'bus'],
        'اطفال' => ['enfant', 'ecole', 'creche'],
        'doctor' => ['medecin', 'sante'],
        'hospital' => ['hopital', 'sante'],
        'pharmacy' => ['pharmacie'],
        'housing' => ['logement'],
        'water' => ['eau'],
        'power' => ['electricite', 'energie'],
        'road' => ['route', 'rue', 'voirie'],
        'police' => ['police'],
        'fire' => ['incendie', 'pompier'],
        // Arabe (interface en arabe ; mots courants, sans article)
        'وثائق' => ['papier', 'identite', 'etat', 'civil'],
        'اوراق' => ['papier', 'identite', 'etat', 'civil'],
        'هوية' => ['identite', 'papier'],
        'طفل' => ['enfant', 'ecole', 'creche'],
        'رضيع' => ['naissance', 'creche', 'enfant'],
        'مدرسة' => ['ecole', 'education'],
        'قمامة' => ['dechet', 'poubelle', 'collecte'],
        'نفايات' => ['dechet', 'poubelle', 'collecte'],
        'حافلة' => ['navette', 'bus', 'transport'],
        'مريض' => ['sante', 'medecin', 'soin'],
        'طبيب' => ['medecin', 'sante'],
        'مستشفى' => ['hopital', 'sante'],
        'صيدلية' => ['pharmacie'],
        'سكن' => ['logement'],
        'ماء' => ['eau'],
        'كهرباء' => ['electricite', 'energie'],
        'شرطة' => ['police'],
    ];

    /** @return list<string> mots du catalogue correspondant à un mot du quotidien (vide si inconnu) */
    public static function expand(string $word): array
    {
        return self::normalized()[$word] ?? [];
    }

    /** @return list<string> tous les mots connus du dictionnaire (pour corriger une faute de frappe) */
    public static function knownWords(): array
    {
        return array_map('strval', array_keys(self::normalized()));
    }

    /**
     * Clés et valeurs passées par la même normalisation que la recherche (lettres arabes avec hamza, pluriels).
     *
     * @return array<string, list<string>>
     */
    private static function normalized(): array
    {
        static $normalized = null;
        if ($normalized === null) {
            $normalized = [];
            foreach (self::SYNONYMS as $key => $values) {
                $normalized[TextFolding::singular(TextFolding::fold((string) $key))] = array_map(
                    fn (string $value) => TextFolding::singular(TextFolding::fold($value)),
                    $values,
                );
            }
        }

        return $normalized;
    }
}
