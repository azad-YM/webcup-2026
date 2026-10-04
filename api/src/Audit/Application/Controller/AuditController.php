<?php

declare(strict_types=1);

namespace Audit\Application\Controller;

use Audit\Application\Query\ListAuditEntries\ListAuditEntriesQuery;
use Audit\Application\Query\ListSecurityEvents\ListSecurityEventsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class AuditController extends AppController
{
    #[Route('/api/audit/entries', name: 'audit_list_entries', methods: ['GET'], format: 'json')]
    public function list(Request $request): JsonResponse
    {
        $param = static function (string $name) use ($request): ?string {
            $value = $request->query->get($name);

            return is_string($value) ? $value : null;
        };

        return $this->dispatchQuery(new ListAuditEntriesQuery(
            $param('actor'),
            $param('action'),
            $param('category'),
            $param('from'),
            $param('to'),
            $param('q'),
        ));
    }

    /** F100 : derniers événements de sécurité en clair, pour l'espace de travail des agents (`admin.audit.read`). */
    #[Route('/api/audit/security-events', name: 'audit_security_events', methods: ['GET'], format: 'json')]
    public function securityEvents(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListSecurityEventsQuery($request->query->getInt('limit', 20), $request->query->getInt('days', 7)));
    }
}
