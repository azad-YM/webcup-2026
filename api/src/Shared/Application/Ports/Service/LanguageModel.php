<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Service;

/**
 * Text generation by a language model (requests marked "IA": D10, F75, F85, F90, F91, F92).
 *
 * The model is optional: without a key, or when the provider fails or is slow, `complete()` returns null
 * and the consumer applies its own local fallback (keywords, synonyms, rules). A consumer never depends on
 * an answer to work. Prompts must not contain secrets nor more personal data than needed for the task.
 */
interface LanguageModel
{
    /** True when a provider is configured; an available model may still return null on a given call. */
    public function isAvailable(): bool;

    /**
     * Single-turn completion. `$system` frames the task (role, output format, language), `$user` carries the input.
     * Returns the trimmed text answer, or null when unavailable, on error, timeout or empty answer.
     */
    public function complete(string $system, string $user, int $maxTokens = 512): ?string;
}
