<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Query\ListLoginSecurityEvents\ListLoginSecurityEventsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class SecurityJournalController extends AppController
{
    #[Route('/api/iam/security/login-events', name: 'iam_login_security_events', methods: ['GET'], format: 'json')]
    public function list(Request $request): JsonResponse
    {
        $search = $request->query->get('q');
        return $this->dispatchQuery(new ListLoginSecurityEventsQuery(is_string($search) ? $search : null));
    }
}
