<?php

declare(strict_types=1);
namespace Citizen\Application\Query\ListServiceRequests;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler]
final readonly class ListServiceRequestsHandler {
 public function __construct(private CitizenRepository $citizens,private CurrentAccountProvider $identity,private ServiceRequestRepository $requests,private RequestAccessPolicy $access){}
 public function __invoke(ListServiceRequestsQuery $query):array {
  if($query->agent&&!$this->access->canRead())throw new AccessDeniedException('Request reading denied.');
  if($query->status!==null&&!in_array($query->status,['submitted','acknowledged','in_progress','resolved','rejected'],true))throw new \DomainException('Invalid status.');
  $id=$query->agent?null:($this->citizens->findByUserId($this->identity->userId())??throw new NotFoundException('Citizen not found.'))->id;
  $page=max(1,$query->page);
  return ['items'=>array_map(static fn($r)=>$r->view(),$this->requests->list($id,$query->status,$page)),'total'=>$this->requests->count($id,$query->status),'pendingCount'=>$this->requests->count($id,'submitted'),'page'=>$page,'pageSize'=>20,'canWrite'=>$query->agent&&$this->access->canWrite(),'topic'=>$query->agent?'private.agents.requests':'private.citizen.'.$id.'.requests'];
 }
}
