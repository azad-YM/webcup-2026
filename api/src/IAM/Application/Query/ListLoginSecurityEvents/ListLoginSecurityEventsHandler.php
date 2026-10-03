<?php

declare(strict_types=1);

namespace IAM\Application\Query\ListLoginSecurityEvents;

use IAM\Application\Ports\Provider\SecurityJournalAccessPolicy;
use IAM\Application\Ports\Repository\LoginSecurityEventRepository;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListLoginSecurityEventsHandler
{
    public const LIMIT = 200;

    public function __construct(private LoginSecurityEventRepository $events, private SecurityJournalAccessPolicy $access) {}

    /** @return array{items: list<array<string, mixed>>} */
    public function __invoke(ListLoginSecurityEventsQuery $query): array
    {
        if (!$this->access->canReadSecurityJournal()) throw new AccessDeniedException('Security journal reading is not allowed.');
        $search = $query->search !== null && trim($query->search) !== '' ? mb_substr(trim($query->search), 0, 180) : null;
        $items = [];
        foreach ($this->events->latest(self::LIMIT, $search) as $event) {
            $items[] = [
                'id' => $event->id,
                'occurredAt' => $event->occurredAt->format(\DATE_ATOM),
                'scope' => $event->scope,
                'email' => $event->email,
                'ip' => $event->ip,
                'failures' => $event->failures,
                'lockedSeconds' => $event->lockedSeconds,
            ];
        }
        return ['items' => $items];
    }
}
