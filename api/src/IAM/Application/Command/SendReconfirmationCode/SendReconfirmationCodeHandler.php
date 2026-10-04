<?php

declare(strict_types=1);

namespace IAM\Application\Command\SendReconfirmationCode;

use IAM\Application\Service\CurrentAccount;
use IAM\Application\Service\IdentityReconfirmation;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SendReconfirmationCodeHandler
{
    public function __construct(private CurrentAccount $account, private IdentityReconfirmation $reconfirmation) {}

    /** @return array<string, mixed> `{challengeId, emailHint, expiresIn}` ou refus contractuel */
    public function __invoke(SendReconfirmationCodeCommand $cmd): array
    {
        return $this->reconfirmation->issue($this->account->user());
    }
}
