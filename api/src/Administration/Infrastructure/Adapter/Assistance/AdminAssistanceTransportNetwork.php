<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Adapter\Assistance;

use Administration\Application\Query\ListTransportLines\ListTransportLinesHandler;
use Administration\Application\Query\ListTransportLines\ListTransportLinesQuery;
use Assistance\Application\Ports\Provider\NetworkLine;
use Assistance\Application\Ports\Provider\TransportNetwork;

/** F97 : Assistance lit les lignes publiques d'Administration (aucune donnée personnelle). */
final readonly class AdminAssistanceTransportNetwork implements TransportNetwork
{
    public function __construct(private ListTransportLinesHandler $lines) {}

    public function lines(): array
    {
        return array_map(static fn (array $view): NetworkLine => new NetworkLine(
            (string) $view['id'],
            (string) $view['code'],
            (string) $view['name'],
            array_values(array_map('strval', (array) $view['stops'])),
            array_values(array_map('strval', (array) $view['districts'])),
            (string) $view['frequency'],
            (string) $view['status'],
            (string) $view['statusMessage'],
            is_string($view['returnAt'] ?? null) ? $view['returnAt'] : null,
            array_values(array_map(static fn (array $item): array => [
                'kind' => (string) $item['kind'],
                'label' => (string) $item['label'],
                'details' => (string) ($item['details'] ?? ''),
                'lineId' => is_string($item['lineId'] ?? null) ? $item['lineId'] : null,
            ], (array) $view['replacements'])),
        ), ($this->lines)(new ListTransportLinesQuery()));
    }
}
