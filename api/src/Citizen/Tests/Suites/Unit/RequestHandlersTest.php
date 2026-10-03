<?php
declare(strict_types=1);
namespace Tests\Citizen\Suites\Unit;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Group;
use Citizen\Application\Command\SubmitServiceRequest\{SubmitServiceRequestCommand,SubmitServiceRequestHandler};
use Citizen\Application\Command\ChangeRequestStatus\{ChangeRequestStatusCommand,ChangeRequestStatusHandler};
use Citizen\Application\Command\AuthorizeRequestSubscription\{AuthorizeRequestSubscriptionCommand,AuthorizeRequestSubscriptionHandler};
use Citizen\Application\Query\ListServiceRequests\{ListServiceRequestsQuery,ListServiceRequestsHandler};
use Citizen\Domain\Entity\Citizen;
use Tests\Citizen\Doubles\Repository\{RamCitizenRepository,RamServiceRequestRepository};
use Tests\Citizen\Doubles\Provider\{StubCurrentAccountProvider,StubRequestAccessPolicy};
use Tests\Citizen\Doubles\Service\FixedClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Infrastructure\Realtime\SignedRealtimeSubscriptionGrant;
use Shared\Domain\Exception\{AccessDeniedException,ConflitException};
#[Group('Unit')]
final class RequestHandlersTest extends TestCase {
 private RamCitizenRepository $citizens;private RamServiceRequestRepository $requests;private StubCurrentAccountProvider $identity;private StubRequestAccessPolicy $access;private SubmitServiceRequestHandler $handler;
 protected function setUp():void{parent::setUp();$this->bootHandler();}
 private function bootHandler():void{
  $this->citizens=new RamCitizenRepository();$this->requests=new RamServiceRequestRepository();$this->identity=new StubCurrentAccountProvider();$this->access=new StubRequestAccessPolicy();
  $this->citizens->save(new Citizen('citizen','account-id',new \DateTimeImmutable()));
  $ids=new class implements IIdProvider{public function getId():string{return 'request';}};
  $this->handler=new SubmitServiceRequestHandler($this->citizens,$this->identity,$this->requests,$ids,new FixedClock());
 }
 private function makeCommand(array $override=[]):SubmitServiceRequestCommand{return new SubmitServiceRequestCommand(...array_merge(['type'=>'contact','subject'=>'Bonjour','description'=>'Ma demande'],$override));}
 public function testSubmissionUsesCurrentCitizenAndPersistsEvent():void{$result=($this->handler)($this->makeCommand());self::assertSame('citizen',$this->requests->find($result['id'])->citizenId);self::assertCount(1,$this->requests->events);}
 public function testInvalidReportDoesNotSave():void{try{($this->handler)($this->makeCommand(['type'=>'report']));self::fail();}catch(\DomainException){}self::assertSame(0,$this->requests->saves);}
 public function testOwnerIsolation():void{($this->handler)($this->makeCommand());$this->citizens->save(new Citizen('other','other-account',new \DateTimeImmutable()));$this->identity->id='other-account';$query=new ListServiceRequestsHandler($this->citizens,$this->identity,$this->requests,$this->access);self::assertSame([],$query(new ListServiceRequestsQuery())['items']);}
 public function testDeniedStatusDoesNotSave():void{($this->handler)($this->makeCommand());$handler=new ChangeRequestStatusHandler($this->access,$this->requests,new FixedClock());try{$handler(new ChangeRequestStatusCommand('request','acknowledged','submitted'));self::fail();}catch(AccessDeniedException){}self::assertSame(1,$this->requests->saves);self::assertSame('submitted',$this->requests->find('request')->status());}
 public function testStaleStatusRefused():void{($this->handler)($this->makeCommand());$this->access->write=true;$handler=new ChangeRequestStatusHandler($this->access,$this->requests,new FixedClock());$this->expectException(ConflitException::class);$handler(new ChangeRequestStatusCommand('request','resolved','in_progress'));}
 public function testCannotAuthorizeAnotherCitizenTopic():void{$signer=new SignedRealtimeSubscriptionGrant(new FixedClock(),'mercure','secret','','');$handler=new AuthorizeRequestSubscriptionHandler($this->citizens,$this->identity,$this->access,$signer);$this->expectException(AccessDeniedException::class);$handler(new AuthorizeRequestSubscriptionCommand('private.citizen.other.requests'));}
 public function testOwnTopicIsGrantedAndAgentTopicDenied():void{$signer=new SignedRealtimeSubscriptionGrant(new FixedClock(),'mercure','secret','','');$handler=new AuthorizeRequestSubscriptionHandler($this->citizens,$this->identity,$this->access,$signer);self::assertArrayHasKey('token',$handler(new AuthorizeRequestSubscriptionCommand('private.citizen.citizen.requests')));$this->expectException(AccessDeniedException::class);$handler(new AuthorizeRequestSubscriptionCommand('private.agents.requests'));}
}
