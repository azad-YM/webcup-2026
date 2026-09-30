<?php

declare(strict_types=1);

namespace IAM\Application\Controller;
use IAM\Application\Command\IssuePortalCode\IssuePortalCodeCommand;
use IAM\Application\Command\ExchangePortalCode\ExchangePortalCodeCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class PortalSessionController extends AppController
{
    #[Route('/api/iam/portal-codes', methods: ['POST'], format: 'json')]
    public function issue(#[MapRequestPayload] IssuePortalCodeCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
    #[Route('/api/iam/portal-sessions', methods: ['POST'], format: 'json')]
    public function exchange(#[MapRequestPayload] ExchangePortalCodeCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
}
