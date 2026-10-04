<?php

declare(strict_types=1);

namespace Assistance\Application\Ports\Provider;

/** Contrat de `TransportNetwork` (F97) : une ligne de transport telle que l'assistance la lit. */
final readonly class NetworkLine
{
    /**
     * @param list<string> $stops arrêts dans l'ordre du parcours
     * @param list<string> $districts quartiers desservis
     * @param list<array{kind: string, label: string, details: string, lineId: ?string}> $replacements
     */
    public function __construct(
        public string $id,
        public string $code,
        public string $name,
        public array $stops,
        public array $districts,
        public string $frequency,
        /** `normal`, `disrupted` (perturbée) ou `interrupted` (interrompue). */
        public string $status,
        public string $statusMessage,
        public ?string $returnAt,
        public array $replacements,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
