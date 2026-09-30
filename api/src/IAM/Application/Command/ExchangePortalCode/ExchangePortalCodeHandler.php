<?php

declare(strict_types=1);

namespace IAM\Application\Command\ExchangePortalCode;
use IAM\Application\Ports\Service\PortalTokenIssuer;
use IAM\Application\Ports\Repository\PortalLoginCodeRepository;
use IAM\Application\Service\PortalAccessPolicy;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ExchangePortalCodeHandler
{
    public function __construct(private PortalTokenIssuer $tokens, private PortalLoginCodeRepository $codes, private PortalAccessPolicy $access, private IClock $clock) {}
    public function __invoke(ExchangePortalCodeCommand $cmd): array
    {
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $cmd->verifier, true)), '+/', '-_'), '=');
        $grant = $this->codes->consume(hash('sha256', $cmd->code), $cmd->destination, $challenge, $this->clock->now()->getTimestamp());
        if ($grant === null) throw new AccessDeniedException('Invalid, expired or already used code.');
        $this->access->assertAllowed($grant->userId, $grant->destination);
        return ['token' => $this->tokens->issue($grant->userId, $grant->email, $grant->destination, $grant->sessionExpiresAt)];
    }
}
