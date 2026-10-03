<?php

declare(strict_types=1);

namespace Pilotage\Application\Query\GetWebcupFeed;

use Pilotage\Application\Ports\Gateway\WebcupFeedGateway;
use Pilotage\Application\Ports\Provider\PilotageAccessPolicy;
use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Pilotage\Domain\Model\WebcupRequest;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetWebcupFeedHandler
{
    public function __construct(
        private PilotageAccessPolicy $access,
        private WebcupFeedGateway $feed,
        private ?RequestTrackingRepository $trackings = null,
    ) {}

    /** @return array{session: array<string, mixed>, requests: list<array<string, mixed>>, fetchedAt: string, canEditTracking: bool} */
    public function __invoke(GetWebcupFeedQuery $query): array
    {
        if (!$this->access->canReadWebcupFeed()) {
            throw new AccessDeniedException('The Webcup feed is reserved to administration members allowed to read it.');
        }
        $feed = $this->feed->fetch();
        $trackings = $this->trackings?->all() ?? [];
        $session = $feed->session;

        return [
            'session' => [
                'status' => $session->status,
                'isRunning' => $session->isRunning,
                'currentWave' => $session->currentWave,
                'elapsedMinutes' => $session->elapsedMinutes,
                'visibleRequestsCount' => $session->visibleRequestsCount,
                'nextWaveNumber' => $session->nextWaveNumber,
                'minutesUntilNextWave' => $session->minutesUntilNextWave,
                'hasNextWave' => $session->hasNextWave(),
                'requestsCount' => count($feed->requests),
                'totalXpAvailable' => $feed->totalXpAvailable(),
            ],
            'requests' => array_map(fn (WebcupRequest $request): array => [
                'tracking' => isset($trackings[$request->requestCode]) ? $trackings[$request->requestCode]->view() : null,
                'requestCode' => $request->requestCode,
                'requesterName' => $request->requesterName,
                'requesterType' => $request->requesterType,
                'messagePublic' => $request->messagePublic,
                'difficulty' => $request->difficulty,
                'difficultyLevel' => $request->difficultyLevel,
                'xpBase' => $request->xpBase,
                'xpTimeBonus' => $request->xpTimeBonus,
                'xpTotal' => $request->xpTotal,
                'xpAvailable' => $request->xpAvailable,
                'isInitial' => $request->isInitial,
                'waveNumber' => $request->waveNumber,
                'arrivalTime' => $request->arrivalTime,
                'groupName' => $request->groupName,
                'isAiRequest' => $request->isAiRequest,
                'sortOrder' => $request->sortOrder,
            ], $feed->requests),
            'fetchedAt' => $feed->fetchedAt->format(\DateTimeInterface::ATOM),
            'canEditTracking' => $this->access->canEditTracking(),
        ];
    }
}
