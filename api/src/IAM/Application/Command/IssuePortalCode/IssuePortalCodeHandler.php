<?php

declare(strict_types=1);

namespace IAM\Application\Command\IssuePortalCode;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use IAM\Application\Ports\Service\PortalCodeGenerator;
use IAM\Application\Ports\Service\PortalTokenIssuer;
use IAM\Application\Ports\Repository\PortalLoginCodeRepository;
use IAM\Application\Service\PortalAccessPolicy;
use IAM\Domain\Entity\PortalLoginCode;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus: 'command.bus')]
final readonly class IssuePortalCodeHandler
{
    public function __construct(private IAuthenticatedUserProvider $identity, private PortalTokenIssuer $tokens, private PortalLoginCodeRepository $codes, private PortalAccessPolicy $access, private IClock $clock, private PortalCodeGenerator $generator) {}
    public function __invoke(IssuePortalCodeCommand $cmd): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/D', $cmd->challenge)) throw new \DomainException('Invalid code challenge.');
        $user = $this->identity->getUser();
        $this->access->assertAllowed($user->getId(), $cmd->destination);
        $session = $this->tokens->currentSession();
        $now = $this->clock->now()->getTimestamp();
        if ($session['expiresAt'] <= $now) throw new \DomainException('Expired session.');
        $code = $this->generator->generate();
        $this->codes->save(new PortalLoginCode(hash('sha256', $code), $user->getId(), $user->getEmail(), $cmd->destination, $cmd->challenge, $session['hash'], min($now + 60, $session['expiresAt']), $session['expiresAt']));
        return ['code' => $code];
    }
}
