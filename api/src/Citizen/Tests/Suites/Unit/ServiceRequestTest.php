<?php

declare(strict_types=1);
namespace Tests\Citizen\Suites\Unit;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Group;
use Citizen\Domain\Entity\ServiceRequest;
#[Group('Unit')]
final class ServiceRequestTest extends TestCase {
 public function testSubmissionAndProgressKeepHistory(): void {
  $at=new \DateTimeImmutable('2026-10-03');
  $r=ServiceRequest::submit('123','citizen','contact','Bonjour','Ma demande',null,null,$at);
  self::assertSame('submitted',$r->status()); self::assertCount(1,$r->pullDomainEvents());
  $r->transition('acknowledged',null,$at); $r->transition('in_progress','Pris en charge',$at); $r->transition('resolved','Réparé',$at);
  self::assertSame('resolved',$r->status()); self::assertCount(4,$r->steps()); self::assertCount(3,$r->pullDomainEvents());
 }
 public function testReportNeedsLocation(): void { $this->expectException(\DomainException::class); ServiceRequest::submit('1','c','report','Panne','Lampe cassée',null,null,new \DateTimeImmutable()); }
 public function testRejectedNeedsReasonAndDoesNotMutate(): void {
  $r=ServiceRequest::submit('1','c','contact','Bonjour','Ma demande',null,null,new \DateTimeImmutable()); $r->pullDomainEvents();
  try {$r->transition('rejected',' ',new \DateTimeImmutable());self::fail();} catch(\DomainException){}
  self::assertSame('submitted',$r->status());self::assertSame([],$r->pullDomainEvents());
 }
 public function testCannotSkipWorkflow(): void { $r=ServiceRequest::submit('1','c','contact','Bonjour','Ma demande',null,null,new \DateTimeImmutable());$this->expectException(\DomainException::class);$r->transition('resolved',null,new \DateTimeImmutable()); }
}
