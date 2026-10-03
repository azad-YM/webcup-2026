<?php

declare(strict_types=1);

namespace Administration\Application\Command\SaveMunicipalService;

use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Domain\Entity\MunicipalService;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SaveMunicipalServiceHandler
{
    public const PERMISSION = 'admin.service.write';

    public function __construct(
        private MunicipalServiceRepository $services,
        private CheckCurrentMemberPermissionsHandler $permissions,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SaveMunicipalServiceCommand $cmd): array
    {
        if (!($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]))) {
            throw new AccessDeniedException('Permission de gestion des services requise.');
        }
        $data = get_object_vars($cmd);
        $service = $this->services->find($cmd->id);
        $created = $service === null;
        if ($service === null) {
            $service = MunicipalService::create($cmd->id, $data, $this->clock->now());
        } else {
            $service->revise($data, $this->clock->now());
        }
        $this->services->save($service);
        $view = $service->view();
        $this->audit?->record(
            $created ? 'administration.service.created' : 'administration.service.updated',
            'municipal-service',
            $service->id,
            sprintf('Service « %s » %s (état : %s).', (string) ($view['name'] ?? $service->id), $created ? 'créé' : 'modifié', (string) ($view['status'] ?? '?')),
            ['status' => $view['status'] ?? null],
        );

        return $view;
    }
}
