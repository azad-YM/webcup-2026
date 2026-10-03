<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeAccountStatus;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\AccountSessionRevoker;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class ChangeAccountStatusHandler
{
    public function __construct(private IUserRepository $users, private AccountSessionRevoker $sessions) {}
    public function __invoke(ChangeAccountStatusCommand $cmd): void
    {
        $user = $this->users->findById($cmd->userId) ?? throw new NotFoundException('Account not found.');
        if (!in_array($cmd->status, ['active', 'suspended', 'deleted'], true)) throw new \DomainException('Invalid account status.');
        if ($cmd->status === 'deleted') $user->deleteAccount();
        else $user->setSuspended($cmd->status === 'suspended');
        $this->sessions->revokePortalCodes($user->getId());
        $this->users->save($user);
    }
}
