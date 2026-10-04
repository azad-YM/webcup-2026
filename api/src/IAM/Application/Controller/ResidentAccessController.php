<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Command\ChangeMyPassword\ChangeMyPasswordCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** F71: a resident replaces the provisional access code received at the city reception. */
final class ResidentAccessController extends AppController
{
    #[Route('/api/iam/me/password', name: 'iam_change_my_password', methods: ['POST'], format: 'json')]
    public function changePassword(#[MapRequestPayload] #[\SensitiveParameter] ChangeMyPasswordCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
