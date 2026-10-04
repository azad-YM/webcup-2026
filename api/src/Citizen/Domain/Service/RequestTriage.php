<?php

declare(strict_types=1);

namespace Citizen\Domain\Service;

/**
 * Tri automatique d'une demande (F80, F86, F79) : catégorie, urgence médicale et priorité proposée,
 * par des règles simples et explicables (type, mots-clés, ancienneté, soutiens d'un signalement public).
 * Aucun appel externe : ces règles s'appliquent toujours, avec ou sans modèle de langage.
 */
final class RequestTriage
{
    public const URGENT = 'urgent';
    public const HIGH = 'high';
    public const NORMAL = 'normal';
    public const LOW = 'low';
    /** Ordre de traitement : le rang le plus petit passe en premier. */
    public const PRIORITY_RANKS = [self::URGENT => 0, self::HIGH => 1, self::NORMAL => 2, self::LOW => 3];
    public const PRIORITIES = [self::URGENT, self::HIGH, self::NORMAL, self::LOW];

    public const MEDICAL_EMERGENCY = 'medical_emergency';
    public const CATEGORIES = [
        self::MEDICAL_EMERGENCY, 'safety', 'water', 'roads', 'lighting', 'cleanliness', 'noise', 'administrative', 'other',
    ];

    /** Une demande encore « envoyée » après ce délai monte d'un cran. */
    public const STALE_DAYS = 7;
    /** Un signalement public soutenu par au moins ce nombre d'habitants passe au moins en priorité haute. */
    public const SUPPORT_THRESHOLD = 10;

    /** Mots qui décrivent une urgence médicale (forme normalisée : minuscules, sans accents). */
    private const MEDICAL_KEYWORDS = [
        'urgence medicale', 'malaise', 'inconscient', 'inconsciente', 'ne respire plus', 'respire mal', 'arret cardiaque',
        'crise cardiaque', 'infarctus', 'avc', 'hemorragie', 'saigne beaucoup', 'perd beaucoup de sang', 'overdose',
        'convulsion', 'convulse', 'etouffe', 's etouffe', 'douleur thoracique', 'douleur dans la poitrine', 'blesse grave',
        'grievement blesse', 'evanoui', 'evanouie', 'suicide', 'intoxication', 'empoisonnement', 'accouchement',
        'allergie grave', 'choc anaphylactique', 'samu', 'ambulance',
    ];

    /** Danger immédiat pour les personnes ou les biens. */
    private const URGENT_KEYWORDS = [
        'incendie', 'feu', 'fuite de gaz', 'odeur de gaz', 'explosion', 'effondrement', 'effondre', 'cable electrique a terre',
        'fil electrique a terre', 'electrocution', 'danger immediat', 'inondation', 'inonde', 'glissement de terrain',
        'eboulement', 'arbre tombe', 'personne en danger', 'enfant en danger',
    ];

    private const HIGH_KEYWORDS = [
        'danger', 'dangereux', 'dangereuse', 'accident', 'fuite d eau', 'canalisation', 'egout', 'coupure', 'panne',
        'bloque', 'bloquee', 'trou', 'nid de poule', 'chaussee', 'ecole', 'enfants', 'personne agee', 'handicap',
        'insalubre', 'rats', 'agression', 'violence', 'urgent', 'urgence',
    ];

    private const LOW_KEYWORDS = [
        'renseignement', 'information', 'question', 'suggestion', 'idee', 'proposition', 'remerciement', 'merci',
        'horaires', 'simple demande',
    ];

    private const CATEGORY_KEYWORDS = [
        'safety' => ['danger', 'agression', 'violence', 'vol', 'securite', 'incendie', 'feu', 'gaz', 'explosion', 'electrocution', 'cable'],
        'water' => ['eau', 'fuite', 'canalisation', 'egout', 'inondation', 'inonde', 'pluie', 'ravine', 'caniveau'],
        'roads' => ['route', 'rue', 'chaussee', 'trottoir', 'nid de poule', 'trou', 'voirie', 'circulation', 'stationnement', 'panneau', 'feu rouge'],
        'lighting' => ['lampadaire', 'eclairage', 'lumiere', 'ampoule', 'eteint'],
        'cleanliness' => ['dechet', 'dechets', 'poubelle', 'ordure', 'ordures', 'encombrant', 'depot sauvage', 'proprete', 'sale', 'rats', 'tag', 'graffiti'],
        'noise' => ['bruit', 'bruyant', 'tapage', 'musique', 'nuisance sonore'],
        'administrative' => ['acte', 'etat civil', 'papier', 'document', 'inscription', 'dossier', 'attestation', 'carte d identite', 'passeport', 'facture'],
    ];

    /** Minuscules, sans accents ni ponctuation, espaces simples : base commune des règles et de la similarité. */
    public static function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        $text = strtr($text, [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ç' => 'c', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'í' => 'i', 'ô' => 'o', 'ö' => 'o', 'ó' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ú' => 'u',
            'ÿ' => 'y', 'œ' => 'oe', 'æ' => 'ae', '’' => ' ', '\'' => ' ',
        ]);
        $text = (string) preg_replace('/[^a-z0-9]+/', ' ', $text);

        return trim((string) preg_replace('/\s+/', ' ', $text));
    }

    public static function detectMedicalEmergency(string $text): bool
    {
        return self::firstMatch(self::normalize($text), self::MEDICAL_KEYWORDS) !== null;
    }

    public static function category(string $text, bool $medicalEmergency): string
    {
        if ($medicalEmergency) {
            return self::MEDICAL_EMERGENCY;
        }
        $normalized = self::normalize($text);
        $best = 'other';
        $bestScore = 0;
        foreach (self::CATEGORY_KEYWORDS as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (self::contains($normalized, $keyword)) {
                    ++$score;
                }
            }
            if ($score > $bestScore) {
                $best = $category;
                $bestScore = $score;
            }
        }

        return $best;
    }

    /**
     * Priorité de base, au dépôt : urgence médicale, danger immédiat, gêne importante, simple information.
     *
     * @return array{priority: string, reason: string}
     */
    public static function basePriority(string $type, string $category, bool $medicalEmergency, string $text): array
    {
        if ($medicalEmergency) {
            return ['priority' => self::URGENT, 'reason' => 'Urgence médicale signalée par l’habitant.'];
        }
        $normalized = self::normalize($text);
        if (($word = self::firstMatch($normalized, self::URGENT_KEYWORDS)) !== null) {
            return ['priority' => self::URGENT, 'reason' => sprintf('Danger immédiat évoqué (« %s »).', $word)];
        }
        if (($word = self::firstMatch($normalized, self::HIGH_KEYWORDS)) !== null) {
            return ['priority' => self::HIGH, 'reason' => sprintf('Gêne importante ou risque évoqué (« %s »).', $word)];
        }
        if ($category === 'safety') {
            return ['priority' => self::HIGH, 'reason' => 'Sujet de sécurité.'];
        }
        if ($type === 'contact' && ($word = self::firstMatch($normalized, self::LOW_KEYWORDS)) !== null) {
            return ['priority' => self::LOW, 'reason' => sprintf('Simple demande d’information (« %s »).', $word)];
        }

        return ['priority' => self::NORMAL, 'reason' => $type === 'report' ? 'Signalement sans signe de danger.' : 'Message sans signe d’urgence.'];
    }

    /**
     * Ajuste une priorité automatique avec l'ancienneté et les soutiens publics ; ne descend jamais.
     *
     * @return array{priority: string, reason: string}
     */
    public static function escalate(string $priority, string $reason, bool $stillWaiting, \DateTimeImmutable $createdAt, \DateTimeImmutable $now, int $supports): array
    {
        if ($supports >= self::SUPPORT_THRESHOLD && self::PRIORITY_RANKS[$priority] > self::PRIORITY_RANKS[self::HIGH]) {
            $priority = self::HIGH;
            $reason = sprintf('Signalement public très soutenu (%d soutiens).', $supports);
        }
        $days = (int) floor(($now->getTimestamp() - $createdAt->getTimestamp()) / 86400);
        if ($stillWaiting && $days >= self::STALE_DAYS && $priority !== self::URGENT) {
            $priority = self::PRIORITIES[self::PRIORITY_RANKS[$priority] - 1];
            $reason = sprintf('En attente de prise en charge depuis %d jours. %s', $days, $reason);
        }

        return ['priority' => $priority, 'reason' => mb_substr($reason, 0, 255)];
    }

    /** @param list<string> $keywords */
    private static function firstMatch(string $normalized, array $keywords): ?string
    {
        foreach ($keywords as $keyword) {
            if (self::contains($normalized, $keyword)) {
                return $keyword;
            }
        }

        return null;
    }

    private static function contains(string $normalized, string $keyword): bool
    {
        return preg_match('/(^| )' . preg_quote($keyword, '/') . '( |$)/', $normalized) === 1;
    }
}
