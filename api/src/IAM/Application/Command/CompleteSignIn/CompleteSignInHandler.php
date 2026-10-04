<?php

declare(strict_types=1);

namespace IAM\Application\Command\CompleteSignIn;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Service\SignInFlow;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class CompleteSignInHandler
{
    public function __construct(private IUserRepository $users, private SignInFlow $flow) {}

    /** @return array<string, mixed> */
    public function __invoke(CompleteSignInCommand $cmd): array
    {
        $user = $this->users->findById($cmd->userId) ?? throw new NotFoundException('Account not found.');

        return $this->flow->begin($user, $cmd->method, $cmd->deviceId);
    }
}
