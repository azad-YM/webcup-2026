<?php

declare(strict_types=1);

namespace Communication\Application\Controller;

use Communication\Application\Command\SaveAlert\SaveAlertCommand;
use Communication\Application\Command\SavePublication\SavePublicationCommand;
use Communication\Application\Query\GetMyNotifications\GetMyNotificationsQuery;
use Communication\Application\Query\GetPublication\GetPublicationQuery;
use Communication\Application\Query\ListActiveAlerts\ListActiveAlertsQuery;
use Communication\Application\Query\ListManagedAlerts\ListManagedAlertsQuery;
use Communication\Application\Query\ListManagedPublications\ListManagedPublicationsQuery;
use Communication\Application\Query\ListPublications\ListPublicationsQuery;
use Communication\Application\Query\SuggestPublicationPlainLanguage\SuggestPublicationPlainLanguageQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** HTTP contract: see `src/Communication/doc/README.md`. */
final class CommunicationController extends AppController
{
    #[Route('/api/communication/publications', methods: ['GET'], format: 'json')]
    public function publications(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListPublicationsQuery($request->query->getBoolean('important')));
    }

    #[Route('/api/communication/publications/{id}', methods: ['GET'], format: 'json', requirements: ['id' => '[A-Za-z0-9-]{1,80}'])]
    public function publication(string $id): JsonResponse
    {
        return $this->dispatchQuery(new GetPublicationQuery($id));
    }

    #[Route('/api/communication/alerts', methods: ['GET'], format: 'json')]
    public function alerts(): JsonResponse
    {
        return $this->dispatchQuery(new ListActiveAlertsQuery());
    }

    #[Route('/api/communication/me/notifications', methods: ['GET'], format: 'json')]
    public function notifications(): JsonResponse
    {
        return $this->dispatchQuery(new GetMyNotificationsQuery());
    }

    #[Route('/api/communication/manage/publications', methods: ['GET'], format: 'json')]
    public function managedPublications(): JsonResponse
    {
        return $this->dispatchQuery(new ListManagedPublicationsQuery());
    }

    #[Route('/api/communication/manage/publications', methods: ['PUT'], format: 'json')]
    public function savePublication(#[MapRequestPayload] SavePublicationCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    /** F89 : brouillon de version « En clair » d'une publication (modèle de langage ou repli local), rien n'est enregistré. */
    #[Route('/api/communication/manage/publications/plain-language', name: 'communication_suggest_plain_language', methods: ['POST'], format: 'json')]
    public function suggestPlainLanguage(#[MapRequestPayload] SuggestPublicationPlainLanguageQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    #[Route('/api/communication/manage/alerts', methods: ['GET'], format: 'json')]
    public function managedAlerts(): JsonResponse
    {
        return $this->dispatchQuery(new ListManagedAlertsQuery());
    }

    #[Route('/api/communication/manage/alerts', methods: ['PUT'], format: 'json')]
    public function saveAlert(#[MapRequestPayload] SaveAlertCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
