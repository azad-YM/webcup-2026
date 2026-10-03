<?php

declare(strict_types=1);

namespace Administration\Application\Command\SetMunicipalServiceAvailability;

use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\RealtimePublisher;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F63 : interrupteur d'urgence d'un service municipal. L'effet est immédiat : Citizen refuse les nouvelles demandes
 * et réservations dès la fin de la transaction (lecture par son port `MunicipalServiceDirectory`), et le site est
 * prévenu sur le topic public `public.services` (identifiant et état seulement, ADR 004).
 *
 * MunicipalService n'émet pas d'événement de domaine : la publication part du cas d'usage, dans la transaction du
 * `command.bus` (le transport `database` écrit dans la même connexion ; un échec du temps réel n'annule rien).
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetMunicipalServiceAvailabilityHandler
{
    public const PERMISSION = 'admin.service.disable';
    public const TOPIC = 'public.services';

    public function __construct(
        private MunicipalServiceRepository $services,
        private CheckCurrentMemberPermissionsHandler $permissions,
        private IClock $clock,
        private ?RealtimePublisher $realtime = null,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SetMunicipalServiceAvailabilityCommand $cmd): array
    {
        if (!($this->permissions)(new CheckCurrentMemberPermissionsQuery([self::PERMISSION]))) {
            throw new AccessDeniedException('Permission de désactivation des services requise.');
        }
        $service = $this->services->find($cmd->id) ?? throw new NotFoundException('Service introuvable.');
        $now = $this->clock->now();
        if ($cmd->disabled) {
            $service->disable($cmd->reason, $now);
        } else {
            $service->enable($now);
        }
        $this->services->save($service);
        $this->audit?->record(
            $cmd->disabled ? 'administration.service.disabled' : 'administration.service.enabled',
            'municipal-service',
            $service->id,
            sprintf('Service « %s » %s.', $service->name(), $cmd->disabled ? 'désactivé' : 'réactivé'),
            $cmd->disabled ? ['reason' => mb_substr(trim($cmd->reason), 0, 200)] : [],
        );
        $this->realtime?->publish(self::TOPIC, 'service.availability', ['id' => $service->id, 'disabled' => $service->isDisabled()]);

        return $service->view();
    }
}
