<?php

declare(strict_types=1);

namespace Administration\Application\Controller;

use Administration\Application\Command\SaveMunicipalService\SaveMunicipalServiceCommand;
use Administration\Application\Command\SetMunicipalServiceAvailability\SetMunicipalServiceAvailabilityCommand;
use Administration\Application\Query\GetMunicipalService\GetMunicipalServiceQuery;
use Administration\Application\Query\ListDistricts\ListDistrictsQuery;
use Administration\Application\Query\ListMunicipalServices\ListMunicipalServicesQuery;
use Administration\Application\Query\SuggestServicePlainLanguage\SuggestServicePlainLanguageQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Public catalogue of municipal services and closed list of districts; edition by agents. */
final class MunicipalServiceController extends AppController
{
    #[Route('/api/administration/services', methods: ['GET'], format: 'json')]
    public function list(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListMunicipalServicesQuery(
            $request->query->getString('q') ?: null,
            $request->query->getString('category') ?: null,
            $request->query->getBoolean('featured'),
        ));
    }

    #[Route('/api/administration/services/{id}', methods: ['GET'], format: 'json', requirements: ['id' => '[a-z0-9][a-z0-9-]{0,79}'])]
    public function show(string $id): JsonResponse
    {
        return $this->dispatchQuery(new GetMunicipalServiceQuery($id));
    }

    #[Route('/api/administration/services', methods: ['PUT'], format: 'json')]
    public function save(#[MapRequestPayload] SaveMunicipalServiceCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    /** F63 : désactivation immédiate (motif obligatoire) ou réactivation d'un service, `admin.service.disable`. */
    #[Route('/api/administration/services/availability', methods: ['POST'], format: 'json')]
    public function availability(#[MapRequestPayload] SetMunicipalServiceAvailabilityCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    /** F89 : brouillon de version « En clair » (modèle de langage ou repli local), rien n'est enregistré. */
    #[Route('/api/administration/services/plain-language', name: 'administration_suggest_plain_language', methods: ['POST'], format: 'json')]
    public function suggestPlainLanguage(#[MapRequestPayload] SuggestServicePlainLanguageQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    #[Route('/api/administration/districts', methods: ['GET'], format: 'json')]
    public function districts(): JsonResponse
    {
        return $this->dispatchQuery(new ListDistrictsQuery());
    }
}
