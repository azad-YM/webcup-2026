<?php

declare(strict_types=1);

namespace IAM\Application\Service;
use IAM\Application\Ports\Provider\AccessibleSpacesProvider;
use Shared\Domain\Exception\AccessDeniedException;
final readonly class PortalAccessPolicy
{
    /** @param iterable<AccessibleSpacesProvider> $providers */
    public function __construct(private iterable $providers) {}
    public function assertAllowed(string $userId, string $destination): void
    {
        if ($destination !== 'admin') throw new AccessDeniedException('Unsupported destination.');
        foreach ($this->providers as $provider) foreach ($provider->findForUser($userId) as $space) {
            if ($space->code === $destination) return;
        }
        throw new AccessDeniedException('No access to this destination.');
    }
}
