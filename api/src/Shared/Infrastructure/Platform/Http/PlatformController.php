<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Platform\Http;

use Shared\Infrastructure\Platform\DegradedModeListener;
use Shared\Infrastructure\Platform\PlatformState;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * F77 : état public de la plateforme, lu par le site (bandeau « Service en mode allégé ») et par l'admin.
 * Réponse minuscule, mise en cache 15 s par les navigateurs et proxys.
 */
final readonly class PlatformController
{
    /** Ce qui reste servi et ce qui est suspendu en mode allégé (libellés affichables). */
    public const ESSENTIAL = ['Alertes et consignes', 'Numéros et conduite à tenir en urgence', 'Services municipaux', 'Envoi de demandes et de signalements', 'Connexion'];
    public const SUSPENDED = ['Assistant et résumés automatiques', 'Carte interactive', 'Mises à jour en direct (remplacées par une actualisation régulière)', 'Statistiques et tableaux de bord'];

    public function __construct(private PlatformState $state) {}

    #[Route('/api/platform/status', name: 'shared_platform_status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        $state = $this->state->current();
        $degraded = $state['mode'] === 'degraded';
        $response = new JsonResponse([
            'mode' => $state['mode'],
            'source' => $state['source'],
            'since' => $state['since'],
            'until' => $state['until'],
            'reason' => $state['reason'],
            'message' => $degraded ? DegradedModeListener::MESSAGE : 'Tous les services fonctionnent normalement.',
            'essential' => self::ESSENTIAL,
            'suspended' => $degraded ? self::SUSPENDED : [],
            'retryAfter' => $degraded ? $this->state->retryAfterSeconds() : null,
        ]);
        $response->headers->set('Cache-Control', 'public, max-age=15');

        return $response;
    }
}
