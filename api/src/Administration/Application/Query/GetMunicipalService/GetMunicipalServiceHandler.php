<?php

declare(strict_types=1);

namespace Administration\Application\Query\GetMunicipalService;

use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMunicipalServiceHandler
{
    public function __construct(private MunicipalServiceRepository $services) {}

    /** @return array<string, mixed> */
    public function __invoke(GetMunicipalServiceQuery $query): array
    {
        $service = $this->services->find($query->id) ?? throw new NotFoundException('Service introuvable.');

        return $service->view();
    }
}
