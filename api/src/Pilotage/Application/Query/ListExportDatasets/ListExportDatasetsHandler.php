<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\ListExportDatasets;

use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Support\ExportCatalog;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F88 : jeux de données exportables, avec leurs colonnes ; les colonnes sensibles sont verrouillées sans `admin.sensitive-data.read`. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListExportDatasetsHandler
{
    public function __construct(private PilotageAccessPolicy $access, private ExportCatalog $catalog) {}

    /** @return array{canExportSensitiveData: bool, datasets: list<array<string, mixed>>} */
    public function __invoke(ListExportDatasetsQuery $query): array
    {
        if (!$this->access->canExportData()) {
            throw new AccessDeniedException('Les exports demandent la permission admin.export.read.');
        }
        $sensitive = $this->access->canExportSensitiveData();
        $datasets = [];
        foreach ($this->catalog->datasets() as $dataset) {
            $columns = [];
            foreach ($dataset->columns as $column) {
                $columns[] = [
                    'key' => $column->key,
                    'label' => $column->label,
                    'sensitive' => $column->sensitive,
                    'locked' => $column->sensitive && !$sensitive,
                    'selected' => $column->selected && !$column->sensitive,
                ];
            }
            $statuses = [];
            foreach ($dataset->statuses as $value => $label) {
                $statuses[] = ['value' => $value, 'label' => $label];
            }
            $datasets[] = [
                'key' => $dataset->key,
                'label' => $dataset->label,
                'description' => $dataset->description,
                'periodLabel' => $dataset->periodLabel,
                'statuses' => $statuses,
                'columns' => $columns,
            ];
        }

        return ['canExportSensitiveData' => $sensitive, 'datasets' => $datasets];
    }
}
