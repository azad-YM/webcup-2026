<?php

declare(strict_types=1);
namespace Citizen\Application\Ports\Repository;
use Citizen\Domain\Entity\ServiceRequest;
interface ServiceRequestRepository {
 public function save(ServiceRequest $request):void;
 public function find(string $id):?ServiceRequest;
 /** @return list<ServiceRequest> */ public function list(?string $citizenId,?string $status,int $page):array;
 public function count(?string $citizenId,?string $status):int;
}
