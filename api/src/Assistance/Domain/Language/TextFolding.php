<?php

declare(strict_types=1);

namespace Assistance\Domain\Language;

/**
 * Normalisation tolérante d'un texte d'habitant (D10) : minuscules, sans accents, mots utiles au singulier.
 * Règles pures, sans dépendance au framework ; l'extension intl est utilisée si elle est présente.
 */
final class TextFolding
{
    /** Mots vides (français, anglais) ignorés par la recherche. */
    private const STOP_WORDS = [
        'a', 'au', 'aux', 'avec', 'ce', 'ces', 'cette', 'comment', 'dans', 'de', 'des', 'du', 'elle', 'en', 'est', 'et', 'il', 'je', 'j',
        'la', 'le', 'les', 'leur', 'l', 'ma', 'mais', 'me', 'mes', 'mon', 'ne', 'nous', 'on', 'ou', 'par', 'pas', 'pour', 'qu', 'que', 'qui',
        'sa', 'se', 'ses', 'son', 'sur', 'ta', 'te', 'tes', 'ton', 'tu', 'un', 'une', 'vos', 'votre', 'vous', 'y', 'c', 'd', 'n', 's', 'm', 't',
        'ai', 'as', 'avoir', 'etre', 'suis', 'faire', 'fait', 'veux', 'voudrais', 'besoin', 'bonjour', 'merci', 'svp', 'stp', 'plait', 'aide',
        'aider', 'peux', 'puis', 'quoi', 'ou', 'quel', 'quelle', 'chez', 'moi', 'tout', 'tres', 'plus', 'bien', 'ca', 'cela',
        'the', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'my', 'i', 'is', 'it', 'need', 'want', 'how', 'can', 'please', 'help', 'with', 'where', 'what',
    ];

    public static function fold(string $text): string
    {
        $text = mb_strtolower($text);
        if (class_exists(\Normalizer::class)) {
            $text = (string) preg_replace('/\p{Mn}+/u', '', (string) \Normalizer::normalize($text, \Normalizer::FORM_D));
        } else {
            $text = strtr($text, [
                'à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i', 'í' => 'i',
                'ô' => 'o', 'ö' => 'o', 'ó' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ú' => 'u', 'ç' => 'c', 'ñ' => 'n', 'ÿ' => 'y',
            ]);
            $text = (string) preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $text);
        }

        return strtr($text, ['œ' => 'oe', 'æ' => 'ae', '’' => "'"]);
    }

    /**
     * Mots significatifs : sans accents, sans mots vides, ramenés au singulier (« poubelles » → « poubelle »).
     *
     * @return list<string>
     */
    public static function words(string $text): array
    {
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', self::fold($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $words = [];
        foreach ($tokens as $token) {
            if (in_array($token, self::STOP_WORDS, true) || (mb_strlen($token) < 2 && !ctype_digit($token))) {
                continue;
            }
            $words[] = self::singular($token);
        }

        return array_values(array_unique($words));
    }

    /** Pluriels réguliers du français et de l'anglais ; article arabe « ال » retiré. */
    public static function singular(string $word): string
    {
        $length = mb_strlen($word);
        if (preg_match('/^\p{Arabic}/u', $word) === 1) {
            return $length > 4 && str_starts_with($word, 'ال') ? mb_substr($word, 2) : $word;
        }
        if ($length > 4 && str_ends_with($word, 'aux')) {
            return mb_substr($word, 0, -3).'al';
        }
        if ($length > 3 && (str_ends_with($word, 's') || str_ends_with($word, 'x')) && !str_ends_with($word, 'ss')) {
            return mb_substr($word, 0, -1);
        }

        return $word;
    }

    /** Tolérance aux fautes de frappe : 1 lettre jusqu'à 7 caractères, 2 au-delà ; rien sous 4 caractères. */
    public static function isCloseTo(string $typed, string $known): bool
    {
        $length = mb_strlen($typed);
        if ($length < 4 || abs($length - mb_strlen($known)) > 2) {
            return false;
        }
        $distance = levenshtein($typed, $known);

        return $distance <= ($length >= 8 ? 2 : 1);
    }
}
