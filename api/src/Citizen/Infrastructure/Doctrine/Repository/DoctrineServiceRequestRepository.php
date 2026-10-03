<?php

declare(strict_types=1);
namespace Citizen\Infrastructure\Doctrine\Repository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Domain\Entity\ServiceRequest;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
final readonly class DoctrineServiceRequestRepository implements ServiceRequestRepository {
 public function __construct(private EntityManagerInterface $manager,private MessageBusInterface $eventBus){}
 public function save(ServiceRequest $request):void{$this->manager->persist($request);foreach($request->pullDomainEvents() as $event)$this->eventBus->dispatch($event);}
 public function find(string $id):?ServiceRequest{return $this->manager->find(ServiceRequest::class,$id);}
 public function list(?string $citizenId,?string $status,int $page):array{return $this->manager->getRepository(ServiceRequest::class)->findBy($this->criteria($citizenId,$status),['createdAt'=>'DESC','id'=>'DESC'],20,($page-1)*20);}
 public function count(?string $citizenId,?string $status):int{return $this->manager->getRepository(ServiceRequest::class)->count($this->criteria($citizenId,$status));}
 private function criteria(?string $citizenId,?string $status):array{return array_filter(['citizenId'=>$citizenId,'status'=>$status],static fn($v)=>$v!==null);}
}
