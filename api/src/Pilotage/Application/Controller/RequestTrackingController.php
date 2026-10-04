<?php

declare(strict_types=1);

namespace Pilotage\Application\Controller;

use Pilotage\Application\Command\UpdateRequestTracking\UpdateRequestTrackingCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class RequestTrackingController extends AppController
{
    #[Route('/api/pilotage/tracking/{requestCode}', name: 'put_pilotage_tracking', methods: ['PUT'], format: 'json', requirements: ['requestCode' => '[A-Za-z0-9_-]{1,20}'])]
    public function update(string $requestCode, #[MapRequestPayload] UpdateRequestTrackingCommand $cmd): JsonResponse
    {
        $cmd->requestCode = $requestCode;

        return $this->dispatch($cmd);
    }
}
