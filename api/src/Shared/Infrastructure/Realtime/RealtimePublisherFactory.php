<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime;

use Psr\Container\ContainerInterface;
use Shared\Application\Ports\Service\RealtimePublisher;

/**
 * Picks the realtime adapter from the `REALTIME_TRANSPORT` environment variable (`mercure`, `pusher`, `none`).
 * Switching provider is an infrastructure setting: no use case, binding or client code changes.
 */
final readonly class RealtimePublisherFactory
{
    /** @param ContainerInterface $transports locator of adapters indexed by transport name */
    public function __construct(private ContainerInterface $transports) {}

    public function create(string $transport): RealtimePublisher
    {
        $transport = strtolower(trim($transport));
        if (!$this->transports->has($transport)) {
            throw new \InvalidArgumentException(sprintf('Unknown REALTIME_TRANSPORT "%s" (expected mercure, pusher or none).', $transport));
        }

        return $this->transports->get($transport);
    }
}
