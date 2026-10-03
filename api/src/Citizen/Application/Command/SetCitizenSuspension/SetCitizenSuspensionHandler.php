<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SetCitizenSuspension;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetCitizenSuspensionHandler
{
    public function __construct(private CitizenRepository $citizens, private CitizenAccountManager $accounts, private CitizenAccountAccessPolicy $access, private ?AuditTrail $audit = null) {}
    public function __invoke(SetCitizenSuspensionCommand $cmd): array
    {
        if (!$this->access->canManageAccounts()) throw new AccessDeniedException('Citizen account management is not allowed.');
        $citizen = $this->citizens->findById($cmd->citizenId) ?? throw new NotFoundException('Citizen not found.');
        if ($citizen->status() === 'deleted') throw new ConflitException('A deleted account cannot be restored.');
        if ($this->access->isProtectedAccount($citizen->userId)) throw new ConflitException('An active administration membership protects this shared account.');
        $this->accounts->suspend($citizen->userId, $cmd->suspended);
        $citizen->setSuspended($cmd->suspended);
        $this->citizens->save($citizen);
        $this->audit?->record($cmd->suspended ? 'citizen.account.suspended' : 'citizen.account.reactivated', 'citizen-account', $citizen->id, $cmd->suspended ? 'Compte citoyen suspendu.' : 'Compte citoyen réactivé.', ['userId' => $citizen->userId]);
        return ['id' => $citizen->id, 'status' => $citizen->status()];
    }
}
