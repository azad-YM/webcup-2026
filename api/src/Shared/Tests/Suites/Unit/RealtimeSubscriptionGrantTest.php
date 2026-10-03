<?php
declare(strict_types=1);
namespace Tests\Shared\Suites\Unit;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Group;
use Shared\Application\Ports\Service\IClock;
use Shared\Infrastructure\Realtime\SignedRealtimeSubscriptionGrant;
#[Group('Unit')]
final class RealtimeSubscriptionGrantTest extends TestCase {
 public function testScopedExpiringMercureGrant(): void {
  $clock = new class implements IClock { public function now(): \DateTimeImmutable { return new \DateTimeImmutable('@1000'); } };
  $grant = (new SignedRealtimeSubscriptionGrant($clock, 'mercure', 'secret', '', ''))->grant('private.citizen.123.requests');
  [$header,$payload,$signature] = explode('.', $grant['token']);
  self::assertSame(['exp'=>1300,'mercure'=>['subscribe'=>['private.citizen.123.requests']]], json_decode(base64_decode(strtr($payload,'-_','+/')),true));
  self::assertSame(rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$payload", 'secret', true)), '+/', '-_'), '='), $signature);
 }
 public function testPusherGrantBindsSocketAndPrivateChannel(): void {
  $clock = new class implements IClock { public function now(): \DateTimeImmutable { return new \DateTimeImmutable('@1000'); } };
  self::assertSame(['auth'=>'key:'.hash_hmac('sha256','123.456:private-agents.requests','secret')], (new SignedRealtimeSubscriptionGrant($clock,'pusher','','key','secret'))->grant('private.agents.requests','123.456'));
 }
}
