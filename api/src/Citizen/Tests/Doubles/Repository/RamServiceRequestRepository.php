<?php
declare(strict_types=1);
namespace Tests\Citizen\Doubles\Repository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Domain\Entity\ServiceRequest;
final class RamServiceRequestRepository implements ServiceRequestRepository {
 public array $items=[]; public array $events=[]; public int $saves=0;
 public function save(ServiceRequest $r):void{$this->items[$r->id]=$r;$this->saves++;array_push($this->events,...$r->pullDomainEvents());}
 public function find(string $id):?ServiceRequest{return $this->items[$id]??null;}
 public function list(?string $id,?string $status,int $page):array{return array_slice(array_values(array_filter($this->items,static fn($r)=>($id===null||$r->citizenId===$id)&&($status===null||$r->status()===$status))),($page-1)*20,20);}
 public function count(?string $id,?string $status):int{return count($this->list($id,$status,1));}
}
