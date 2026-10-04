<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Infrastructure\Realtime\NullRealtimePublisher;
use Shared\Infrastructure\Realtime\RealtimePublisherFactory;
use Symfony\Component\DependencyInjection\ServiceLocator;
use Tests\Shared\Doubles\Service\RecordingRealtimePublisher;

/** The transport is chosen by configuration only (REALTIME_TRANSPORT). */
#[Group('Unit')]
final class RealtimePublisherFactoryTest extends TestCase
{
    public function testReturnsTheAdapterOfTheConfiguredTransport(): void
    {
        $mercure = new RecordingRealtimePublisher();
        $factory = $this->factory(['mercure' => $mercure, 'none' => new NullRealtimePublisher()]);

        self::assertSame($mercure, $factory->create(' Mercure '));
        self::assertInstanceOf(NullRealtimePublisher::class, $factory->create('none'));
    }

    public function testRejectsAnUnknownTransport(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->factory(['none' => new NullRealtimePublisher()])->create('carrier-pigeon');
    }

    /** @param array<string, object> $adapters */
    private function factory(array $adapters): RealtimePublisherFactory
    {
        return new RealtimePublisherFactory(new ServiceLocator(array_map(static fn (object $adapter) => static fn () => $adapter, $adapters)));
    }
}
