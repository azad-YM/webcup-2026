<?php

declare(strict_types=1);

namespace Assistance\Domain\Language;

/**
 * Garde-fou de l'assistant (F91) : une urgence vitale ou un danger immédiat est détecté par des règles,
 * avant tout appel au modèle, pour renvoyer tout de suite vers le 15, le 17, le 18 ou le 112.
 * Expressions pliées (sans accents) cherchées dans le texte plié ; français, anglais et arabe courants.
 */
final class EmergencyDetector
{
    public const MEDICAL = 'medical';
    public const FIRE = 'fire';
    public const DANGER = 'danger';

    /** @var array<string, list<string>> */
    private const PATTERNS = [
        self::MEDICAL => [
            'ne respire', 'respire plus', 'respire pas', 'respire mal', 'inconscient', 'evanoui', 'malaise', 'crise cardiaque', 'arret cardiaque',
            'douleur poitrine', 'mal a la poitrine', 'avc', 'convulsion', 'overdose', 'saigne beaucoup', 'hemorragie', 'beaucoup de sang',
            'empoisonn', 'intoxication', 'brule grave', 'ne se reveille', 'tomber de haut', 'accouche', 'perdu connaissance', 'me suicider', 'suicide',
            'en finir avec la vie', 'mourir', 'urgence medicale', 'samu',
            'not breathing', 'unconscious', 'heart attack', 'chest pain', 'stroke', 'bleeding a lot', 'suicid', 'overdose', 'poisoned',
            'لا يتنفس', 'فاقد الوعي', 'نوبة قلبية', 'نزيف', 'انتحار', 'اسعاف',
        ],
        self::FIRE => [
            'incendie', 'au feu', 'en feu', 'brule la', 'ca brule', 'fumee epaisse', 'odeur de gaz', 'fuite de gaz', 'explosion', 'electrocut',
            'on fire', 'gas leak', 'explosion', 'حريق', 'تسرب غاز',
        ],
        self::DANGER => [
            'agression', 'agresse', 'on me frappe', 'me frappe', 'violence', 'menace de mort', 'arme', 'couteau', 'cambrioleur dans', 'quelqu un me suit',
            'enlevement', 'kidnapp', 'en danger', 'au secours', 'violences conjugales', 'battu', 'danger immediat',
            'being attacked', 'in danger', 'weapon', 'خطر', 'اعتداء', 'النجدة',
        ],
    ];

    /** @return self::MEDICAL|self::FIRE|self::DANGER|null */
    public static function detect(string $text): ?string
    {
        $folded = ' '.preg_replace('/[^\p{L}\p{N}]+/u', ' ', TextFolding::fold($text)).' ';
        foreach (self::PATTERNS as $kind => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($folded, ' '.$pattern)) {
                    return $kind;
                }
            }
        }

        return null;
    }

    /** @return list<string> numéros à appeler, du plus adapté au numéro européen */
    public static function numbers(string $kind): array
    {
        return match ($kind) {
            self::FIRE => ['18', '112'],
            self::DANGER => ['17', '112'],
            default => ['15', '112'],
        };
    }
}
