<?php

declare(strict_types=1);

namespace Administration\Application\Query\ListTransportLines;

use Administration\Application\Ports\Repository\TransportLineRepository;
use Administration\Domain\Entity\TransportLine;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F97 : lignes de transport, public ; interrompues d'abord, puis perturbées, puis par numéro. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListTransportLinesHandler
{
    private const RANK = ['interrupted' => 0, 'disrupted' => 1, 'normal' => 2];

    public function __construct(private TransportLineRepository $lines) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListTransportLinesQuery $query): array
    {
        $views = array_map(fn (TransportLine $line) => $line->view(), $this->lines->all());
        usort($views, fn (array $a, array $b) => [self::RANK[$a['status']] ?? 3, $a['code']] <=> [self::RANK[$b['status']] ?? 3, $b['code']]);

        return $views;
    }
}
