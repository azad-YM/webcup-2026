<?php

declare(strict_types=1);
namespace Citizen\Application\Command\SubmitServiceRequest;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Domain\Entity\ServiceRequest;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler]
final readonly class SubmitServiceRequestHandler {
 public function __construct(private CitizenRepository $citizens,private CurrentAccountProvider $identity,private ServiceRequestRepository $requests,private IIdProvider $ids,private IClock $clock){}
 public function __invoke(SubmitServiceRequestCommand $cmd):array {
  $citizen=$this->citizens->findByUserId($this->identity->userId())??throw new NotFoundException('Citizen not found.');
  $request=ServiceRequest::submit($this->ids->getId(),$citizen->id,$cmd->type,$cmd->subject,$cmd->description,$cmd->location,$cmd->serviceId,$this->clock->now());$this->requests->save($request);return $request->view();
 }
}
