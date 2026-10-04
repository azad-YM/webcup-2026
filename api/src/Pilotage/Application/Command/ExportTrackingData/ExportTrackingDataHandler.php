<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\ExportTrackingData;

use Pilotage\Application\Ports\Provider\Export\ExportCriteria;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Support\ExportCatalog;
use Pilotage\Application\Support\ExportFile;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F88 : produit l'aperçu ou le fichier d'un export. Les lignes viennent du BC propriétaire du jeu de données
 * (port `ExportDataSource`) ; Pilotage ne garde que les colonnes choisies, refuse les colonnes sensibles sans
 * `admin.sensitive-data.read`, met en forme et journalise chaque export réel (`pilotage.export.created`).
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ExportTrackingDataHandler
{
    public const PREVIEW_ROWS = 10;
    public const MAX_ROWS = 10000;

    public function __construct(
        private PilotageAccessPolicy $access,
        private ExportCatalog $catalog,
        private AuditTrail $audit,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ExportTrackingDataCommand $command): array
    {
        if (!$this->access->canExportData()) {
            throw new AccessDeniedException('Les exports demandent la permission admin.export.read.');
        }
        $found = $this->catalog->find($command->dataset);
        if ($found === null) {
            throw new \DomainException('Ce jeu de données n’existe pas.');
        }
        [$source, $dataset] = $found;

        $known = [];
        foreach ($dataset->columns as $column) {
            $known[$column->key] = $column;
        }
        $columns = [];
        foreach (array_unique($command->columns) as $key) {
            $column = $known[$key] ?? throw new \DomainException(sprintf('Colonne inconnue : %s.', $key));
            if ($column->sensitive && !$this->access->canExportSensitiveData()) {
                throw new \DomainException(sprintf('La colonne « %s » contient des données personnelles : elle demande la permission admin.sensitive-data.read.', $column->label));
            }
            $columns[$key] = $column->label;
        }
        if ($command->status !== null && $command->status !== '' && !array_key_exists($command->status, $dataset->statuses)) {
            throw new \DomainException('Ce statut n’existe pas pour ce jeu de données.');
        }

        $from = $command->from !== null && $command->from !== '' ? new \DateTimeImmutable($command->from.' 00:00:00') : null;
        $until = $command->to !== null && $command->to !== '' ? new \DateTimeImmutable($command->to.' 00:00:00 +1 day') : null;
        if ($from !== null && $until !== null && $until <= $from) {
            throw new \DomainException('La fin de la période doit suivre son début.');
        }
        $criteria = new ExportCriteria(
            $dataset->periodLabel === null ? null : $from,
            $dataset->periodLabel === null ? null : $until,
            $command->status !== '' ? $command->status : null,
            $command->preview ? self::PREVIEW_ROWS : self::MAX_ROWS + 1,
        );
        $rows = $source->rows($dataset->key, $criteria);
        $truncated = count($rows) > self::MAX_ROWS;
        $rows = array_slice($rows, 0, $command->preview ? self::PREVIEW_ROWS : self::MAX_ROWS);
        $header = [];
        foreach ($columns as $key => $label) {
            $header[] = ['key' => $key, 'label' => $label];
        }

        if ($command->preview) {
            $preview = [];
            foreach ($rows as $row) {
                $line = [];
                foreach ($columns as $key => $label) {
                    $line[$key] = ExportFile::text($row[$key] ?? null);
                }
                $preview[] = $line;
            }

            return ['columns' => $header, 'rows' => $preview];
        }

        $now = $this->clock->now();
        $fileName = sprintf('nova-terra-%s-%s.%s', $dataset->key, $now->format('Y-m-d-His'), $command->format);
        $content = $command->format === 'json'
            ? ExportFile::json($dataset->key, $now->format(\DateTimeInterface::ATOM), $columns, $rows)
            : ExportFile::csv($columns, $rows);

        $period = match (true) {
            $criteria->from !== null && $command->to !== null => sprintf(' du %s au %s', $command->from, $command->to),
            $criteria->from !== null => sprintf(' depuis le %s', $command->from),
            $criteria->until !== null => sprintf(' jusqu’au %s', $command->to),
            default => '',
        };
        $this->audit->record(
            'pilotage.export.created',
            'export',
            $dataset->key,
            sprintf('Export « %s » en %s%s : %d ligne(s), %d colonne(s).', $dataset->label, strtoupper($command->format), $period, count($rows), count($columns)),
            [
                'dataset' => $dataset->key,
                'format' => $command->format,
                'from' => $command->from,
                'to' => $command->to,
                'status' => $criteria->status,
                'columns' => array_keys($columns),
                'rows' => count($rows),
                'truncated' => $truncated,
            ],
        );

        return [
            'fileName' => $fileName,
            'mimeType' => $command->format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
            'content' => $content,
            'rowCount' => count($rows),
            'truncated' => $truncated,
        ];
    }
}
