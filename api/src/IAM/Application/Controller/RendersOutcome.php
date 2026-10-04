<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Service\Outcome;
use Symfony\Component\HttpFoundation\JsonResponse;

/** Traduit un refus contractuel retourné par un handler (`Outcome`) en statut HTTP, après validation de la transaction. */
trait RendersOutcome
{
    private function outcome(JsonResponse $response): JsonResponse
    {
        $data = json_decode((string) $response->getContent(), true);
        if (!is_array($data) || !isset($data[Outcome::STATUS_KEY])) {
            return $response;
        }
        $status = (int) $data[Outcome::STATUS_KEY];
        unset($data[Outcome::STATUS_KEY]);
        $headers = isset($data['retryAfter']) && $status === 429 ? ['Retry-After' => (string) $data['retryAfter']] : [];

        return new JsonResponse($data, $status, $headers);
    }
}
