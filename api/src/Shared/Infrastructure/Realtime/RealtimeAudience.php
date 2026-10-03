<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Shared\Application\Ports\Provider\RealtimeAudienceProvider;
use Shared\Application\Ports\Service\RealtimePublisher;

/** Private topics of an account: the union of what each BC grants through RealtimeAudienceProvider. */
final readonly class RealtimeAudience
{
    /** @param iterable<RealtimeAudienceProvider> $providers */
    public function __construct(private iterable $providers) {}

    /** @return list<string> */
    public function topicsFor(?string $userId): array
    {
        if ($userId === null) {
            return [];
        }
        $topics = [];
        foreach ($this->providers as $provider) {
            foreach ($provider->topicsFor($userId) as $topic) {
                if (preg_match(RealtimePublisher::TOPIC_PATTERN, $topic) && !str_starts_with($topic, RealtimeEventRepository::PUBLIC_PREFIX)) {
                    $topics[$topic] = true;
                }
            }
        }

        return array_keys($topics);
    }
}
