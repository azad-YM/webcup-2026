<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Pilotage;

use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesHandler;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesQuery;
use Pilotage\Application\DTO\Report\DirectoryService;
use Pilotage\Application\Ports\Provider\Report\ServiceDirectory;

/** F98 : Pilotage nomme les services à partir du catalogue public d'Administration. */
final readonly class AdminPilotageServiceDirectory implements ServiceDirectory
{
    public function __construct(private ListMunicipalServicesHandler $catalogue) {}

    public function services(): array
    {
        return array_map(static fn (array $view): DirectoryService => new DirectoryService(
            (string) $view['id'],
            (string) $view['name'],
            (string) $view['category'],
            (string) ($view['status'] ?? 'available'),
            (bool) ($view['disabled'] ?? false),
            is_string($view['emergency'] ?? null),
        ), ($this->catalogue)(new ListMunicipalServicesQuery()));
    }
}
