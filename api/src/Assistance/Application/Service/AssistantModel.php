<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

use Assistance\Application\Ports\Provider\CatalogService;
use Shared\Application\Ports\Service\LanguageModel;

/**
 * Accès de l'assistance au port Shared `LanguageModel` : prompts courts, sortie JSON demandée et lue avec tolérance.
 * Toute réponse inexploitable vaut « pas de réponse » : l'appelant applique son repli local.
 */
final readonly class AssistantModel
{
    public const LANGUAGES = ['fr' => 'français', 'en' => 'anglais', 'ar' => 'arabe'];

    public function __construct(private LanguageModel $model) {}

    public static function language(?string $language): string
    {
        return isset(self::LANGUAGES[$language ?? '']) ? (string) $language : 'fr';
    }

    public function isAvailable(): bool
    {
        return $this->model->isAvailable();
    }

    public function text(string $system, string $user, int $maxTokens = 400): ?string
    {
        if (!$this->model->isAvailable()) {
            return null;
        }
        $answer = $this->model->complete($system, $user, $maxTokens);

        return $answer === null || trim($answer) === '' ? null : trim($answer);
    }

    /** @return array<string, mixed>|null premier objet JSON de la réponse, ou null */
    public function json(string $system, string $user, int $maxTokens = 500): ?array
    {
        $answer = $this->text($system, $user, $maxTokens);
        if ($answer === null) {
            return null;
        }
        $start = strpos($answer, '{');
        $end = strrpos($answer, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $decoded = json_decode(substr($answer, $start, $end - $start + 1), true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Catalogue résumé pour le prompt : identifiant, nom, résumé court et état, une ligne par service.
     *
     * @param list<CatalogService> $services
     */
    public static function catalogueLines(array $services): string
    {
        return implode("\n", array_map(
            fn (CatalogService $service) => sprintf(
                '%s | %s | %s%s',
                $service->id,
                $service->name,
                mb_substr(preg_replace('/\s+/', ' ', $service->summary) ?? '', 0, 120),
                $service->disabled ? ' | indisponible' : ($service->status !== 'available' ? ' | perturbé' : ''),
            ),
            $services,
        ));
    }

    /**
     * Identifiants proposés par le modèle, gardés seulement s'ils existent dans le catalogue (garde-fou anti-invention).
     *
     * @param list<CatalogService> $services
     *
     * @return list<string>
     */
    public static function knownIds(mixed $ids, array $services, int $limit = 3): array
    {
        if (!is_array($ids)) {
            return [];
        }
        $known = array_flip(array_map(fn (CatalogService $service) => $service->id, $services));
        $valid = [];
        foreach ($ids as $id) {
            if (is_string($id) && isset($known[$id]) && !in_array($id, $valid, true)) {
                $valid[] = $id;
            }
        }

        return array_slice($valid, 0, $limit);
    }

    /** Texte libre du modèle borné et nettoyé (pas de balisage). */
    public static function clean(mixed $text, int $max = 1200): ?string
    {
        if (!is_string($text)) {
            return null;
        }
        $text = trim(strip_tags($text));

        return $text === '' ? null : mb_substr($text, 0, $max);
    }
}
