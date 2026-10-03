<?php
namespace Citizen\Application\Controller;
use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceQuery;
use Citizen\Application\Command\SetMyAlertPreference\SetMyAlertPreferenceCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
final class AlertPreferenceController extends AppController {
 #[Route('/api/citizen/me/alert-preferences',methods:['GET'],format:'json')]
 public function get(): JsonResponse { return $this->dispatchQuery(new GetMyAlertPreferenceQuery()); }
 #[Route('/api/citizen/me/alert-preferences',methods:['PUT'],format:'json')]
 public function save(#[MapRequestPayload] SetMyAlertPreferenceCommand $cmd): JsonResponse { return $this->dispatch($cmd); }
}
