<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Citizen;

use Administration\Application\Query\GetMunicipalService\GetMunicipalServiceHandler;
use Administration\Application\Query\GetMunicipalService\GetMunicipalServiceQuery;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesHandler;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesQuery;
use Citizen\Application\Ports\Provider\MunicipalServiceDirectory;
use Citizen\Application\Ports\Provider\MunicipalServiceSummary;
use Shared\Domain\Exception\NotFoundException;

/** Citizen (appointments) reads the name and reception place of a municipal service from the Administration catalogue. */
final readonly class AdminCitizenServiceDirectory implements MunicipalServiceDirectory
{
    public function __construct(private GetMunicipalServiceHandler $services, private ListMunicipalServicesHandler $catalogue) {}

    public function find(string $serviceId): ?MunicipalServiceSummary
    {
        try {
            $view = ($this->services)(new GetMunicipalServiceQuery($serviceId));
        } catch (NotFoundException) {
            return null;
        }

        return self::summary($view);
    }

    public function all(): array
    {
        return array_map(self::summary(...), ($this->catalogue)(new ListMunicipalServicesQuery()));
    }

    /** @param array<string, mixed> $view */
    private static function summary(array $view): MunicipalServiceSummary
    {
        $contact = is_array($view['contact'] ?? null) ? $view['contact'] : [];

        return new MunicipalServiceSummary(
            (string) $view['id'],
            (string) $view['name'],
            (string) ($contact['place'] ?? ''),
            (string) ($contact['hours'] ?? ''),
        );
    }
}
