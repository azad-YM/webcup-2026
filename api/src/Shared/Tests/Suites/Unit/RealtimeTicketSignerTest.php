<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Application\Ports\Service\IClock;
use Shared\Infrastructure\Realtime\RealtimeTicketSigner;

#[Group('Unit')]
final class RealtimeTicketSignerTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();
        $this->now = new \DateTimeImmutable('2026-10-03T16:00:00+00:00');
    }

    public function testIssuesATicketBoundToTheAccount(): void
    {
        $signer = $this->signer();

        self::assertSame('account-id', $signer->verify($signer->issue('account-id')));
    }

    public function testRejectsAForgedOrTamperedTicket(): void
    {
        $ticket = $this->signer()->issue('account-id');
        [$body, $signature] = explode('.', $ticket);
        $forgedBody = rtrim(strtr(base64_encode('{"sub":"admin-id","exp":9999999999}'), '+/', '-_'), '=');

        self::assertNull($this->signer()->verify($forgedBody . '.' . $signature));
        self::assertNull($this->signer('another-secret')->verify($ticket));
        self::assertNull($this->signer()->verify('not-a-ticket'));
    }

    public function testRejectsAnExpiredTicket(): void
    {
        $ticket = $this->signer()->issue('account-id');
        $this->now = $this->now->modify(sprintf('+%d seconds', RealtimeTicketSigner::TTL_SECONDS + 1));

        self::assertNull($this->signer()->verify($ticket));
    }

    private function signer(string $secret = 'test-secret'): RealtimeTicketSigner
    {
        $clock = new class ($this) implements IClock {
            public function __construct(private RealtimeTicketSignerTest $test) {}

            public function now(): \DateTimeImmutable
            {
                return $this->test->now();
            }
        };

        return new RealtimeTicketSigner($secret, $clock);
    }

    public function now(): \DateTimeImmutable
    {
        return $this->now;
    }
}
