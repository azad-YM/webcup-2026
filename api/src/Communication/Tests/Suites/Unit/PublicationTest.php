<?php
namespace Tests\Communication\Suites\Unit;
use Communication\Domain\Entity\Publication;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Group;
use Shared\Domain\Exception\DomainException;
#[Group('Unit')]
final class PublicationTest extends TestCase {
 private function data(array $extra=[]): array { return [...['title'=>'Alerte','category'=>'Ville','summary'=>'Information','body'=>['Consigne'],'state'=>'published','important'=>false,'severity'=>null,'audience'=>'all','district'=>null,'startsAt'=>null,'endsAt'=>null,'recommendations'=>''],...$extra]; }
 public function testHealthAudienceIsOptIn(): void { $p=Publication::save('a',$this->data(['severity'=>'warning','audience'=>'health','startsAt'=>'2026-10-03T00:00:00Z','endsAt'=>'2026-10-04T00:00:00Z']),new \DateTimeImmutable('2026-10-03')); self::assertFalse($p->matches(null,false)); self::assertTrue($p->matches(null,true)); self::assertFalse($p->active(new \DateTimeImmutable('2026-10-04'))); self::assertCount(1,$p->pullDomainEvents()); self::assertSame([],$p->pullDomainEvents()); }
 public function testDistrictAlertDoesNotLeakToOtherDistrict(): void { $p=Publication::save('a',$this->data(['severity'=>'critical','audience'=>'district','district'=>'Nord','startsAt'=>'2026-10-03T00:00:00Z','endsAt'=>'2026-10-04T00:00:00Z']),new \DateTimeImmutable('2026-10-03')); self::assertTrue($p->matches('Nord',false)); self::assertFalse($p->matches('Sud',true)); }
 public function testRejectsReversedValidity(): void { $this->expectException(DomainException::class); Publication::save('a',$this->data(['severity'=>'warning','startsAt'=>'2026-10-04T00:00:00Z','endsAt'=>'2026-10-03T00:00:00Z']),new \DateTimeImmutable()); }
 public function testDraftIsNotPublic(): void { $p=Publication::save('a',$this->data(['state'=>'draft']),new \DateTimeImmutable()); self::assertFalse($p->active(new \DateTimeImmutable())); }
}
