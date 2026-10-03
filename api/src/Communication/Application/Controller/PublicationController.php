<?php
namespace Communication\Application\Controller;
use Communication\Application\Command\SavePublication\SavePublicationCommand;
use Communication\Application\Query\ListPublications\ListPublicationsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class PublicationController extends AppController {
 #[Route('/api/communication/publications',methods:['GET'],format:'json')]
 public function publications(): JsonResponse { return $this->dispatchQuery(new ListPublicationsQuery()); }
 #[Route('/api/communication/alerts',methods:['GET'],format:'json')]
 public function alerts(): JsonResponse { return $this->dispatchQuery(new ListPublicationsQuery('alerts')); }
 #[Route('/api/communication/notifications',methods:['GET'],format:'json')]
 public function notifications(): JsonResponse { return $this->dispatchQuery(new ListPublicationsQuery('notifications')); }
 #[Route('/api/communication/manage',methods:['GET'],format:'json')]
 public function manage(): JsonResponse { return $this->dispatchQuery(new ListPublicationsQuery('admin')); }
 #[Route('/api/communication/publications',methods:['PUT'],format:'json')]
 public function save(#[MapRequestPayload] SavePublicationCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
}
