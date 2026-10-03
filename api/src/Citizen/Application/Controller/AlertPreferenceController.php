<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\SetMyAlertPreference\SetMyAlertPreferenceCommand;
use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Alert preferences of the connected citizen (district of the profile, health alerts consent). */
final class AlertPreferenceController extends AppController
{
    #[Route('/api/citizen/me/alert-preferences', methods: ['GET'], format: 'json')]
    public function show(): JsonResponse
    {
        return $this->dispatchQuery(new GetMyAlertPreferenceQuery());
    }

    #[Route('/api/citizen/me/alert-preferences', methods: ['PUT'], format: 'json')]
    public function save(#[MapRequestPayload] SetMyAlertPreferenceCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
