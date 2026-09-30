<?php

declare(strict_types=1);

namespace IAM\Application\Query\ListMySpaces;

use IAM\Application\DTO\AccessibleSpace;
use IAM\Application\Ports\Provider\AccessibleSpacesProvider;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMySpacesHandler
{
    /** @param iterable<AccessibleSpacesProvider> $providers */
    public function __construct(
        private IAuthenticatedUserProvider $authenticatedUserProvider,
        private iterable $providers,
    ) {}

    /** @return list<AccessibleSpace> */
    public function __invoke(ListMySpacesQuery $query): array
    {
        $userId = $this->authenticatedUserProvider->getUser()->getId();
        $spaces = [];
        foreach ($this->providers as $provider) {
            foreach ($provider->findForUser($userId) as $space) {
                $spaces[$space->code] = $space;
            }
        }

        return array_values($spaces);
    }
}
