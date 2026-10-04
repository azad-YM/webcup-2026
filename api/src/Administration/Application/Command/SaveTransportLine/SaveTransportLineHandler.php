<?php

declare(strict_types=1);

namespace Administration\Application\Command\SaveTransportLine;

use Administration\Application\Ports\Repository\TransportLineRepository;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Domain\Entity\TransportLine;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F97 : même permission que le catalogue des services (`admin.service.write`), action journalisée. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SaveTransportLineHandler
{
    public const PERMISSION = 'admin.service.write';
    private const STATUS_LABELS = ['normal' => 'normale', 'disrupted' => 'perturbée', 'interrupted' => 'interrompue'];

    public function __construct(
        private TransportLineRepository $lines,
        private CheckCurrentMemberPermissionsHandler $permissions,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SaveTransportLineCommand $cmd): array
    {
        if (!($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]))) {
            throw new AccessDeniedException('Permission de gestion des services requise.');
        }
        foreach ($cmd->replacements as $replacement) {
            $target = is_array($replacement) ? ($replacement['lineId'] ?? null) : null;
            if (is_string($target) && $target !== '' && ($target === $cmd->id || $this->lines->find($target) === null)) {
                throw new DomainException('La ligne proposée en remplacement doit être une autre ligne existante.');
            }
        }
        $data = get_object_vars($cmd);
        $now = $this->clock->now();
        $line = $this->lines->find($cmd->id);
        $created = $line === null;
        $previous = $line?->status();
        if ($line === null) {
            $line = TransportLine::create($cmd->id, $data, $now);
        } else {
            $line->revise($data, $now);
        }
        $this->lines->save($line);
        $this->audit?->record(
            $created ? 'administration.transport-line.created' : 'administration.transport-line.updated',
            'transport-line',
            $line->id,
            sprintf('Ligne « %s » %s (circulation %s).', $line->name(), $created ? 'créée' : 'modifiée', self::STATUS_LABELS[$line->status()] ?? $line->status()),
            ['previousStatus' => $previous, 'status' => $line->status(), 'replacements' => count($cmd->replacements)],
        );

        return $line->view();
    }
}
