<?php

declare(strict_types=1);

namespace Administration\Application\Controller;

use Administration\Application\Command\AddMember\AddMemberCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class MemberController extends AppController
{
    #[Route('/api/administration/members', name: 'add_admin_member', methods: ['POST'], format: 'json')]
    public function create(#[MapRequestPayload] #[\SensitiveParameter] AddMemberCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
