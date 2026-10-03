<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\DeleteMyCitizenAccount\DeleteMyCitizenAccountCommand;
use Citizen\Application\Command\SetCitizenSuspension\SetCitizenSuspensionCommand;
use Citizen\Application\Query\ListCitizenAccounts\ListCitizenAccountsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class CitizenAccountController extends AppController
{
    #[Route('/api/citizen/me', name: 'citizen_delete_my_account', methods: ['DELETE'], format: 'json')]
    public function delete(#[MapRequestPayload] #[\SensitiveParameter] DeleteMyCitizenAccountCommand $cmd): JsonResponse { return $this->dispatch($cmd); }

    #[Route('/api/citizen/accounts', name: 'citizen_accounts', methods: ['GET'], format: 'json')]
    public function list(): JsonResponse { return $this->dispatchQuery(new ListCitizenAccountsQuery()); }

    #[Route('/api/citizen/accounts/suspension', name: 'citizen_account_suspension', methods: ['PUT'], format: 'json')]
    public function suspend(#[MapRequestPayload] SetCitizenSuspensionCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
}
