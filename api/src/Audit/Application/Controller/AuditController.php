<?php

declare(strict_types=1);

namespace Audit\Application\Controller;

use Audit\Application\Query\ListAuditEntries\ListAuditEntriesQuery;
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
}
