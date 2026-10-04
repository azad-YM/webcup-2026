<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListOfficialMessages;

use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Domain\Entity\Alert;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F73 : archive publique des messages officiels du Haut Conseil (publiés, en cours ou passés), du plus récent au plus ancien. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListOfficialMessagesHandler
{
    public const LIMIT = 50;

    public function __construct(private AlertRepository $alerts, private IClock $clock) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListOfficialMessagesQuery $query): array
    {
        $now = $this->clock->now();
        $messages = array_values(array_filter(
            $this->alerts->all(),
            static fn (Alert $alert): bool => $alert->isOfficial() && $alert->wasPublished() && $alert->startsAt() <= $now,
        ));
        usort($messages, static fn (Alert $a, Alert $b): int => $b->publishedAt() <=> $a->publishedAt());

        return array_map(
            static fn (Alert $alert): array => $alert->publicView() + ['active' => $alert->isActive($now)],
            array_slice($messages, 0, self::LIMIT),
        );
    }
}
