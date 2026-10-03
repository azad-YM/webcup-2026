<?php
declare(strict_types=1);
namespace Tests\Citizen\Suites\Application;
use PHPUnit\Framework\Attributes\Group;
use Tests\Shared\Infrastructure\ApplicationTestCase;
use Tests\Shared\Fixtures\UserFixture;
use Doctrine\ORM\EntityManagerInterface;
use Citizen\Domain\Entity\Citizen;
use Citizen\Domain\Entity\ServiceRequest;
use Citizen\Domain\Event\ServiceRequestChanged;
use Administration\Domain\Entity\{Member,Role};
use Administration\Domain\VO\Permission;
use Zenstruck\Messenger\Test\InteractsWithMessenger;
#[Group('Application')]
final class ServiceRequestsTest extends ApplicationTestCase {
 use InteractsWithMessenger;
 private UserFixture $owner;private UserFixture $other;private UserFixture $agent;
 protected function setUp():void{parent::setUp();$this->initialize();$this->owner=new UserFixture('owner','owner@example.com');$this->other=new UserFixture('other','other@example.com');$this->agent=new UserFixture('agent','agent@example.com');$this->load([$this->owner,$this->other,$this->agent]);$em=self::getContainer()->get(EntityManagerInterface::class);$em->persist(new Citizen('citizen-owner','owner',new \DateTimeImmutable()));$em->persist(new Citizen('citizen-other','other',new \DateTimeImmutable()));$em->persist(new Role('request-agent','Request agent',[new Permission('admin','request','read'),new Permission('admin','request','write')]));$em->persist(new Member('agent-member','agent','Agent',['request-agent']));$em->flush();$em->clear();$this->owner->authenticate(self::$client);}
 private function submit(array $override=[]):void{$this->request('POST','/api/citizen/requests',array_merge(['type'=>'contact','subject'=>'Une demande','description'=>'Merci de répondre'],$override));}
 private function response():array{return json_decode(self::$client->getResponse()->getContent(),true,flags:JSON_THROW_ON_ERROR);}
 public function testSubmitAndReadOnlyOwnRequests():void{$this->submit(['citizenId'=>'citizen-other']);self::assertResponseStatusCodeSame(200);$r=$this->response();self::assertStringStartsWith('NT-',$r['reference']);self::assertSame('submitted',$r['status']);$this->transport('async')->queue()->assertContains(ServiceRequestChanged::class);$this->request('GET','/api/citizen/requests');self::assertSame(1,$this->response()['total']);$this->other->authenticate(self::$client);$this->request('GET','/api/citizen/requests');self::assertSame(0,$this->response()['total']);}
 public function testRejectReportWithoutLocation():void{$this->submit(['type'=>'report']);self::assertResponseStatusCodeSame(422);self::assertSame(0,self::getContainer()->get(EntityManagerInterface::class)->getRepository(ServiceRequest::class)->count([]));$this->transport('async')->queue()->assertEmpty();}
 public function testAgentProcessesRequestAndCitizenSeesHistory():void{$this->submit();$id=$this->response()['id'];$this->agent->authenticate(self::$client);$this->request('GET','/api/citizen/agent/requests');self::assertResponseStatusCodeSame(200);self::assertSame(1,$this->response()['pendingCount']);$this->request('POST','/api/citizen/agent/requests/status',['requestId'=>$id,'status'=>'acknowledged','expectedStatus'=>'submitted','comment'=>'Reçue']);self::assertResponseStatusCodeSame(200);$this->owner->authenticate(self::$client);$this->request('GET','/api/citizen/requests');self::assertCount(2,$this->response()['items'][0]['steps']);self::assertSame('acknowledged',$this->response()['items'][0]['status']);}
 public function testCitizenCannotReadQueueOrChangeStatus():void{$this->submit();$id=$this->response()['id'];$this->request('GET','/api/citizen/agent/requests');self::assertResponseStatusCodeSame(403);$this->request('POST','/api/citizen/agent/requests/status',['requestId'=>$id,'status'=>'acknowledged','expectedStatus'=>'submitted']);self::assertResponseStatusCodeSame(403);}
 public function testTopicsAreAuthorizedExactly():void{$this->request('POST','/api/citizen/requests/subscription',['topic'=>'private.citizen.citizen-other.requests']);self::assertResponseStatusCodeSame(403);$this->request('POST','/api/citizen/requests/subscription',['topic'=>'private.agents.requests']);self::assertResponseStatusCodeSame(403);$this->request('POST','/api/citizen/requests/subscription',['topic'=>'private.citizen.citizen-owner.requests']);self::assertResponseStatusCodeSame(200);$this->agent->authenticate(self::$client);$this->request('POST','/api/citizen/requests/subscription',['topic'=>'private.agents.requests']);self::assertResponseStatusCodeSame(200);}
 public function testAnonymousCannotSubmit():void{self::$client->setServerParameter('HTTP_AUTHORIZATION','');$this->submit();self::assertResponseStatusCodeSame(401);}
}
