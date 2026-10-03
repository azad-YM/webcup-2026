<?php

declare(strict_types=1);
namespace Citizen\Application\Controller;
use Citizen\Application\Command\SubmitServiceRequest\SubmitServiceRequestCommand;
use Citizen\Application\Command\ChangeRequestStatus\ChangeRequestStatusCommand;
use Citizen\Application\Command\AuthorizeRequestSubscription\AuthorizeRequestSubscriptionCommand;
use Citizen\Application\Query\ListServiceRequests\ListServiceRequestsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class ServiceRequestController extends AppController {
 #[Route('/api/citizen/requests',methods:['POST'],format:'json')]
 public function submit(#[MapRequestPayload] SubmitServiceRequestCommand $cmd):JsonResponse{return $this->dispatch($cmd);}
 #[Route('/api/citizen/requests',methods:['GET'],format:'json')]
 public function mine(Request $request):JsonResponse{return $this->dispatchQuery(new ListServiceRequestsQuery(false,$request->query->get('status')?:null,max(1,$request->query->getInt('page',1))));}
 #[Route('/api/citizen/agent/requests',methods:['GET'],format:'json')]
 public function queue(Request $request):JsonResponse{return $this->dispatchQuery(new ListServiceRequestsQuery(true,$request->query->get('status')?:null,max(1,$request->query->getInt('page',1))));}
 #[Route('/api/citizen/agent/requests/status',methods:['POST'],format:'json')]
 public function status(#[MapRequestPayload] ChangeRequestStatusCommand $cmd):JsonResponse{return $this->dispatch($cmd);}
 #[Route('/api/citizen/requests/subscription',methods:['POST'],format:'json')]
 public function subscription(#[MapRequestPayload] AuthorizeRequestSubscriptionCommand $cmd):JsonResponse{return $this->dispatch($cmd);}
}
