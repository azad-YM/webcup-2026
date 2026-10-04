<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Adapter\Shared;

use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Application\Ports\Provider\RealtimeAudienceProvider;

/** A citizen listens to its own private topic `citizen.{citizenId}` (status of its requests, notifications…). */
final readonly class CitizenRealtimeAudience implements RealtimeAudienceProvider
{
    public const TOPIC_PREFIX = 'citizen.';

    public function __construct(private CitizenRepository $citizens) {}

    public function topicsFor(string $userId): array
    {
        $citizen = $this->citizens->findByUserId($userId);

        return $citizen === null ? [] : [self::TOPIC_PREFIX . $citizen->id];
    }
}
