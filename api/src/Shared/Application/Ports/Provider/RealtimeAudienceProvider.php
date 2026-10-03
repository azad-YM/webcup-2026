<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Provider;

use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Private realtime topics an account may listen to, contributed by each BC for its own data
 * (e.g. Citizen: `citizen.{citizenId}`; Administration: `administration.requests` for agents).
 * The stream never trusts a topic sent by the client: it only serves what these providers return,
 * plus the public topics (`public.*`) open to everyone.
 */
#[AutoconfigureTag('shared.realtime_audience')]
interface RealtimeAudienceProvider
{
    /** @return list<string> */
    public function topicsFor(string $userId): array;
}
