<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Application\Ports\Provider\RealtimeAudienceProvider;
use Shared\Infrastructure\Realtime\RealtimeAudience;

#[Group('Unit')]
final class RealtimeAudienceTest extends TestCase
{
    public function testMergesTheTopicsGrantedByEachContext(): void
    {
        $audience = new RealtimeAudience([$this->provider(['citizen.c1']), $this->provider(['administration.requests', 'citizen.c1'])]);

        self::assertSame(['citizen.c1', 'administration.requests'], $audience->topicsFor('account-id'));
    }

    public function testGivesNoPrivateTopicToAnAnonymousVisitor(): void
    {
        self::assertSame([], (new RealtimeAudience([$this->provider(['citizen.c1'])]))->topicsFor(null));
    }

    public function testIgnoresMalformedAndPublicTopicsFromProviders(): void
    {
        $audience = new RealtimeAudience([$this->provider(['Citizen C1', 'public.alerts', 'citizen.c1'])]);

        self::assertSame(['citizen.c1'], $audience->topicsFor('account-id'));
    }

    /** @param list<string> $topics */
    private function provider(array $topics): RealtimeAudienceProvider
    {
        return new class ($topics) implements RealtimeAudienceProvider {
            /** @param list<string> $topics */
            public function __construct(private array $topics) {}

            public function topicsFor(string $userId): array
            {
                return $this->topics;
            }
        };
    }
}
