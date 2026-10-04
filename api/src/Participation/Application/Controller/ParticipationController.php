<?php

declare(strict_types=1);

namespace Participation\Application\Controller;

use Participation\Application\Command\FollowIdea\FollowIdeaCommand;
use Participation\Application\Command\ProposeIdea\ProposeIdeaCommand;
use Participation\Application\Command\RecordConsultationOutcome\RecordConsultationOutcomeCommand;
use Participation\Application\Command\SaveConsultation\SaveConsultationCommand;
use Participation\Application\Command\SaveProject\SaveProjectCommand;
use Participation\Application\Command\SetIdeaVisibility\SetIdeaVisibilityCommand;
use Participation\Application\Command\SubmitContribution\SubmitContributionCommand;
use Participation\Application\Query\GetConsultation\GetConsultationQuery;
use Participation\Application\Query\GetProject\GetProjectQuery;
use Participation\Application\Query\ListConsultationContributions\ListConsultationContributionsQuery;
use Participation\Application\Query\ListConsultations\ListConsultationsQuery;
use Participation\Application\Query\ListIdeaQueue\ListIdeaQueueQuery;
use Participation\Application\Query\ListManagedConsultations\ListManagedConsultationsQuery;
use Participation\Application\Query\ListManagedProjects\ListManagedProjectsQuery;
use Participation\Application\Query\ListMyParticipation\ListMyParticipationQuery;
use Participation\Application\Query\ListProjects\ListProjectsQuery;
use Participation\Application\Query\ListPublicIdeas\ListPublicIdeasQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Participation\Application\Command\HandleServiceReview\HandleServiceReviewCommand;
use Participation\Application\Command\ReviewService\ReviewServiceCommand;
use Participation\Application\Query\ListServiceRatings\ListServiceRatingsQuery;
use Participation\Application\Query\ListServiceReviews\ListServiceReviewsQuery;

/** HTTP contract: see `src/Participation/doc/README.md`. */
final class ParticipationController extends AppController
{
    private const ID = ['id' => '[A-Za-z0-9-]{1,36}'];

    // --- Public reading ---

    #[Route('/api/participation/projects', name: 'participation_projects', methods: ['GET'], format: 'json')]
    public function projects(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListProjectsQuery($request->query->getString('district') ?: null, $request->query->getString('status') ?: null));
    }

    #[Route('/api/participation/projects/{id}', name: 'participation_project', methods: ['GET'], format: 'json', requirements: self::ID)]
    public function project(string $id): JsonResponse
    {
        return $this->dispatchQuery(new GetProjectQuery($id));
    }

    #[Route('/api/participation/consultations', name: 'participation_consultations', methods: ['GET'], format: 'json')]
    public function consultations(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListConsultationsQuery($request->query->getString('phase') ?: null));
    }

    #[Route('/api/participation/consultations/{id}', name: 'participation_consultation', methods: ['GET'], format: 'json', requirements: self::ID)]
    public function consultation(string $id): JsonResponse
    {
        return $this->dispatchQuery(new GetConsultationQuery($id));
    }

    #[Route('/api/participation/ideas', name: 'participation_ideas', methods: ['GET'], format: 'json')]
    public function ideas(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListPublicIdeasQuery($request->query->getString('status') ?: null));
    }

    /** F76 : moyenne et nombre d'avis par service (agrégat public, sans identité ; `?service=<id>` pour un seul). */
    #[Route('/api/participation/service-ratings', name: 'participation_service_ratings', methods: ['GET'], format: 'json')]
    public function serviceRatings(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListServiceRatingsQuery($request->query->getString('service') ?: null));
    }

    // --- Connected citizen ---

    #[Route('/api/participation/me', name: 'participation_me', methods: ['GET'], format: 'json')]
    public function mine(): JsonResponse
    {
        return $this->dispatchQuery(new ListMyParticipationQuery());
    }

    #[Route('/api/participation/me/contributions', name: 'participation_contribute', methods: ['PUT'], format: 'json')]
    public function contribute(#[MapRequestPayload] SubmitContributionCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/me/ideas', name: 'participation_propose_idea', methods: ['POST'], format: 'json')]
    public function proposeIdea(#[MapRequestPayload] ProposeIdeaCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    /** F76 : avis du mois sur un service (créé ou modifié). */
    #[Route('/api/participation/me/service-reviews', name: 'participation_review_service', methods: ['POST'], format: 'json')]
    public function reviewService(#[MapRequestPayload] ReviewServiceCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    // --- Agents (admin.participation.read / admin.participation.write) ---

    #[Route('/api/participation/manage/service-reviews', name: 'participation_manage_service_reviews', methods: ['GET'], format: 'json')]
    public function serviceReviews(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListServiceReviewsQuery($request->query->getString('status') ?: null, $request->query->getString('service') ?: null));
    }

    #[Route('/api/participation/manage/service-reviews', name: 'participation_handle_service_review', methods: ['PUT'], format: 'json')]
    public function handleServiceReview(#[MapRequestPayload] HandleServiceReviewCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/manage/projects', name: 'participation_manage_projects', methods: ['GET'], format: 'json')]
    public function managedProjects(): JsonResponse
    {
        return $this->dispatchQuery(new ListManagedProjectsQuery());
    }

    #[Route('/api/participation/manage/projects', name: 'participation_save_project', methods: ['PUT'], format: 'json')]
    public function saveProject(#[MapRequestPayload] SaveProjectCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/manage/consultations', name: 'participation_manage_consultations', methods: ['GET'], format: 'json')]
    public function managedConsultations(): JsonResponse
    {
        return $this->dispatchQuery(new ListManagedConsultationsQuery());
    }

    #[Route('/api/participation/manage/consultations', name: 'participation_save_consultation', methods: ['PUT'], format: 'json')]
    public function saveConsultation(#[MapRequestPayload] SaveConsultationCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/manage/consultations/outcome', name: 'participation_consultation_outcome', methods: ['PUT'], format: 'json')]
    public function recordOutcome(#[MapRequestPayload] RecordConsultationOutcomeCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/manage/consultations/{id}/contributions', name: 'participation_consultation_contributions', methods: ['GET'], format: 'json', requirements: self::ID)]
    public function consultationContributions(string $id): JsonResponse
    {
        return $this->dispatchQuery(new ListConsultationContributionsQuery($id));
    }

    #[Route('/api/participation/manage/ideas', name: 'participation_manage_ideas', methods: ['GET'], format: 'json')]
    public function ideaQueue(Request $request): JsonResponse
    {
        return $this->dispatchQuery(new ListIdeaQueueQuery($request->query->getString('status') ?: null));
    }

    #[Route('/api/participation/manage/ideas/status', name: 'participation_follow_idea', methods: ['PUT'], format: 'json')]
    public function followIdea(#[MapRequestPayload] FollowIdeaCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/participation/manage/ideas/visibility', name: 'participation_idea_visibility', methods: ['PUT'], format: 'json')]
    public function ideaVisibility(#[MapRequestPayload] SetIdeaVisibilityCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
