<?php

declare(strict_types=1);
namespace Citizen\Application\Command\ChangeRequestStatus;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Shared\Domain\Exception\ConflitException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler]
final readonly class ChangeRequestStatusHandler {
 public function __construct(private RequestAccessPolicy $access,private ServiceRequestRepository $requests,private IClock $clock){}
 public function __invoke(ChangeRequestStatusCommand $cmd):array {
  if(!$this->access->canWrite())throw new AccessDeniedException('Request processing denied.');
  $request=$this->requests->find($cmd->requestId)??throw new NotFoundException('Request not found.');
  if($request->status()!==$cmd->expectedStatus)throw new ConflitException('The request has changed. Refresh and retry.');
  $request->transition($cmd->status,$cmd->comment,$this->clock->now());$this->requests->save($request);return $request->view();
 }
}
