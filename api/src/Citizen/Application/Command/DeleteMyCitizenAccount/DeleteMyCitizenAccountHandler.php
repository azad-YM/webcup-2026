<?php

declare(strict_types=1);

namespace Citizen\Application\Command\DeleteMyCitizenAccount;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class DeleteMyCitizenAccountHandler
{
    public function __construct(private CitizenRepository $citizens, private CurrentAccountProvider $identity, private CitizenAccountManager $accounts, private CitizenAccountAccessPolicy $access, private iterable $dataErasers = []) {}
    public function __invoke(DeleteMyCitizenAccountCommand $cmd): array
    {
        $userId = $this->identity->userId();
        $citizen = $this->citizens->findByUserId($userId) ?? throw new NotFoundException('Citizen not found.');
        if ($this->access->isProtectedAccount($userId)) throw new ConflitException('An active administration membership protects this shared account.');
        if (!$this->accounts->verifyPassword($userId, $cmd->password)) throw new AccessDeniedException('Invalid password.');
        $this->accounts->delete($userId);
        foreach ($this->dataErasers as $eraser) $eraser->erase($citizen->id);
        $citizen->deleteAccount();
        $this->citizens->save($citizen);
        return ['deleted' => true];
    }
}
