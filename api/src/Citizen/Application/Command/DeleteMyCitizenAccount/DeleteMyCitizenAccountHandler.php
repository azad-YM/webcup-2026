<?php

declare(strict_types=1);

namespace Citizen\Application\Command\DeleteMyCitizenAccount;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class DeleteMyCitizenAccountHandler
{
    public function __construct(private CitizenRepository $citizens, private CurrentAccountProvider $identity, private CitizenAccountManager $accounts, private CitizenAccountAccessPolicy $access, private iterable $dataErasers = [], private ?AuditTrail $audit = null) {}
    public function __invoke(DeleteMyCitizenAccountCommand $cmd): array
    {
        $userId = $this->identity->userId();
        $citizen = $this->citizens->findByUserId($userId) ?? throw new NotFoundException('Citizen not found.');
        if (!$this->accounts->verifyPassword($userId, $cmd->password)) throw new AccessDeniedException('Invalid password.');
        // Rule: an account that is also an active administration member is never deleted from the site,
        // so the agent never loses their access silently (see doc/README.md, « Suppression du compte »).
        if ($this->access->isProtectedAccount($userId)) throw new ConflitException('An active administration membership protects this shared account.');
        $this->accounts->delete($userId);
        foreach ($this->dataErasers as $eraser) $eraser->erase($citizen->id);
        $citizen->deleteAccount();
        $this->citizens->save($citizen);
        $this->audit?->record('citizen.account.deleted', 'citizen-account', $citizen->id, 'Compte citoyen supprimé par son titulaire.', ['userId' => $userId]);
        return ['deleted' => true];
    }
}
