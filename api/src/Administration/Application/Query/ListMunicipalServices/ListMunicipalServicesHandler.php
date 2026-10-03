<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListMunicipalServices;

use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Domain\Entity\MunicipalService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMunicipalServicesHandler
{
    public function __construct(private MunicipalServiceRepository $services) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListMunicipalServicesQuery $query): array
    {
        $services = array_filter(
            $this->services->all(),
            fn (MunicipalService $service) => (!$query->featuredOnly || $service->featured())
                && ($query->category === null || $query->category === '' || $service->category() === $query->category)
                && $service->matches($query->search ?? ''),
        );
        usort($services, fn (MunicipalService $a, MunicipalService $b) => [$b->featured(), $a->name()] <=> [$a->featured(), $b->name()]);

        return array_map(fn (MunicipalService $service) => $service->view(), array_values($services));
    }
}
