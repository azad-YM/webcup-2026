<?php

declare(strict_types=1);

namespace Assistance\Application\Controller;

use Assistance\Application\Query\Explain\ExplainPassageQuery;
use Assistance\Application\Query\FindTransportAlternative\FindTransportAlternativeQuery;
use Assistance\Application\Query\Orient\OrientQuery;
use Assistance\Application\Query\RefineServiceSearch\RefineServiceSearchQuery;
use Assistance\Application\Query\SearchServices\SearchServicesQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Assistance aux habitants (L22), sans compte. Les routes POST appellent le modèle de langage quand il est
 * disponible : elles sont limitées par adresse IP (`config/packages/security_hardening.yaml`, `assistance_*`).
 */
final class AssistanceController extends AppController
{
    /** D10 : recherche tolérante locale (rapide, sans modèle), pour la recherche des services au fil de la saisie. */
    #[Route('/api/assistance/services/search', name: 'assistance_search_services', methods: ['GET'], format: 'json')]
    public function search(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new SearchServicesQuery(
            mb_substr($request->query->getString('q'), 0, 300),
            $request->query->getString('lang', 'fr'),
        ));
    }

    /** D10 (IA) : reformulation et reclassement par le modèle, repli sur la recherche locale. */
    #[Route('/api/assistance/services/search', name: 'assistance_refine_search', methods: ['POST'], format: 'json')]
    public function refine(#[MapRequestPayload] RefineServiceSearchQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    /** F91, F92 : assistant d'orientation (conversation courte, rien n'est stocké). */
    #[Route('/api/assistance/orientation', name: 'assistance_orient', methods: ['POST'], format: 'json')]
    public function orient(#[MapRequestPayload] OrientQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    /** F90 : explication plus simple d'un passage, à la demande. */
    #[Route('/api/assistance/explanations', name: 'assistance_explain', methods: ['POST'], format: 'json')]
    public function explain(#[MapRequestPayload] ExplainPassageQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }

    /** F97 (IA) : solution de remplacement quand des lignes de transport sont interrompues (règles + rédaction par le modèle). */
    #[Route('/api/assistance/transport', name: 'assistance_transport', methods: ['POST'], format: 'json')]
    public function transport(#[MapRequestPayload] FindTransportAlternativeQuery $query): JsonResponse
    {
        return $this->dispatchQuery($query);
    }
}
