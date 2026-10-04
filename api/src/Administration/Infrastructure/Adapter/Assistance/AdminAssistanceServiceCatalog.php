<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Assistance;

use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesHandler;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesQuery;
use Assistance\Application\Ports\Provider\CatalogService;
use Assistance\Application\Ports\Provider\ServiceCatalog;

/**
 * Assistance (D10, F91, F92) lit le catalogue public d'Administration : textes publics, thème, état,
 * lieu, urgence, traductions et version « En clair » (F89). Aucune donnée personnelle.
 */
final readonly class AdminAssistanceServiceCatalog implements ServiceCatalog
{
    public function __construct(private ListMunicipalServicesHandler $catalogue) {}

    public function services(): array
    {
        return array_map(self::service(...), ($this->catalogue)(new ListMunicipalServicesQuery()));
    }

    /** @param array<string, mixed> $view */
    private static function service(array $view): CatalogService
    {
        $contact = is_array($view['contact'] ?? null) ? $view['contact'] : [];
        $translations = [];
        foreach ((array) ($view['translations'] ?? []) as $language => $texts) {
            if (is_array($texts)) {
                $translations[(string) $language] = ['name' => (string) ($texts['name'] ?? ''), 'summary' => (string) ($texts['summary'] ?? '')];
            }
        }

        return new CatalogService(
            (string) $view['id'],
            (string) $view['name'],
            (string) $view['category'],
            (string) $view['summary'],
            array_values(array_map('strval', (array) ($view['keywords'] ?? []))),
            (string) ($view['status'] ?? 'available'),
            (bool) ($view['disabled'] ?? false),
            is_string($view['emergency'] ?? null) ? $view['emergency'] : null,
            (string) ($contact['place'] ?? ''),
            is_string($contact['phone'] ?? null) ? $contact['phone'] : null,
            $translations,
            (string) ($view['plainLanguage'] ?? ''),
        );
    }
}
