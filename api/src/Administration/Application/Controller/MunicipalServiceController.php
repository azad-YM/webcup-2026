<?php
namespace Administration\Application\Controller;
use Administration\Application\Command\SaveMunicipalService\SaveMunicipalServiceCommand;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class MunicipalServiceController extends AppController {
 #[Route('/api/administration/services',methods:['GET'],format:'json')]
 public function list(): JsonResponse { return $this->dispatchQuery(new ListMunicipalServicesQuery()); }
 #[Route('/api/administration/services',methods:['PUT'],format:'json')]
 public function save(#[MapRequestPayload] SaveMunicipalServiceCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
}
