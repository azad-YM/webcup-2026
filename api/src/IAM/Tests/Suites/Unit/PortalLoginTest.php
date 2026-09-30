<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Application\Command\IssuePortalCode\IssuePortalCodeCommand;
use IAM\Application\Command\IssuePortalCode\IssuePortalCodeHandler;
use IAM\Application\Command\ExchangePortalCode\ExchangePortalCodeCommand;
use IAM\Application\Command\ExchangePortalCode\ExchangePortalCodeHandler;
use IAM\Application\DTO\AccessibleSpace;
use IAM\Application\Ports\Repository\PortalLoginCodeRepository;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use IAM\Application\Ports\Service\PortalTokenIssuer;
use IAM\Application\Ports\Service\PortalCodeGenerator;
use IAM\Application\Service\PortalAccessPolicy;
use IAM\Domain\Entity\PortalLoginCode;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\VO\AuthenticatedUser;
use Tests\IAM\Doubles\Provider\StubAccessibleSpacesProvider;

#[Group('Unit')]
final class PortalLoginTest extends TestCase
{
    public function testCodeIsBoundToSessionDestinationAndVerifierAndConsumedOnce(): void
    {
        $identity = $this->createStub(IAuthenticatedUserProvider::class);
        $identity->method('getUser')->willReturn(new AuthenticatedUser('user', 'admin@example.com'));
        $clock = $this->createStub(IClock::class);
        $clock->method('now')->willReturn(new \DateTimeImmutable('@1000'));
        $tokens = $this->createStub(PortalTokenIssuer::class);
        $tokens->method('currentSession')->willReturn(['hash' => 'source-session-hash', 'expiresAt' => 1030]);
        $tokens->method('issue')->willReturn('signed-portal-token');
        $codes = new class implements PortalLoginCodeRepository {
            public ?PortalLoginCode $stored = null;
            public function save(PortalLoginCode $code): void { $this->stored = $code; }
            public function consume(string $hash, string $destination, string $challenge, int $now): ?PortalLoginCode {
                $code = $this->stored;
                if ($code === null || $code->hash !== $hash || $code->destination !== $destination || $code->challenge !== $challenge || $code->expiresAt <= $now || $code->sessionExpiresAt <= $now) return null;
                $this->stored = null;
                return $code;
            }
        };
        $policy = new PortalAccessPolicy([new StubAccessibleSpacesProvider(['user' => [new AccessibleSpace('admin', 'Administration', '', [])]])]);
        $generator = $this->createStub(PortalCodeGenerator::class);
        $generator->method('generate')->willReturn(str_repeat('a', 64));
        $issue = new IssuePortalCodeHandler($identity, $tokens, $codes, $policy, $clock, $generator);
        $verifier = str_repeat('a', 64);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $code = $issue(new IssuePortalCodeCommand('admin', $challenge))['code'];
        self::assertSame(hash('sha256', $code), $codes->stored->hash);
        self::assertSame('source-session-hash', $codes->stored->sessionHash);
        self::assertSame(1030, $codes->stored->expiresAt);
        $exchange = new ExchangePortalCodeHandler($tokens, $codes, $policy, $clock);
        self::assertSame(['token' => 'signed-portal-token'], $exchange(new ExchangePortalCodeCommand($code, 'admin', $verifier)));
        $this->expectException(AccessDeniedException::class);
        $exchange(new ExchangePortalCodeCommand($code, 'admin', $verifier));
    }

    public function testPolicyRejectsUnsupportedAndUnauthorizedDestinations(): void
    {
        $this->expectException(AccessDeniedException::class);
        (new PortalAccessPolicy([]))->assertAllowed('user', 'admin');
    }
}
