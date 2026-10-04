<?php

declare(strict_types=1);

namespace Pilotage\Application\Support;

use Pilotage\Application\Ports\Provider\Export\ExportDataset;
use Pilotage\Application\Ports\Provider\Export\ExportDataSource;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;

/** F88 : réunit les jeux de données exposés par les BC propriétaires (port `ExportDataSource`). */
final readonly class ExportCatalog
{
    /** @param iterable<ExportDataSource> $sources */
    public function __construct(#[AutowireIterator('pilotage.export_source')] private iterable $sources) {}

    /** @return list<ExportDataset> */
    public function datasets(): array
    {
        $datasets = [];
        foreach ($this->sources as $source) {
            foreach ($source->datasets() as $dataset) {
                $datasets[] = $dataset;
            }
        }

        return $datasets;
    }

    /** @return array{0: ExportDataSource, 1: ExportDataset}|null */
    public function find(string $key): ?array
    {
        foreach ($this->sources as $source) {
            foreach ($source->datasets() as $dataset) {
                if ($dataset->key === $key) {
                    return [$source, $dataset];
                }
            }
        }

        return null;
    }
}
