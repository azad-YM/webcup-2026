<?php

declare(strict_types=1);

namespace Citizen\Application\Query\FindSimilarRequests;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Service\SimilarRequestFinder;
use Citizen\Domain\Entity\ServiceRequest;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F75 : demandes qui semblent parler du même problème, et membres du groupe déjà lié.
 * Les vues ne portent ni lieu d'une demande de contact ni identité : objet, état, priorité, quartier, date.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class FindSimilarRequestsHandler
{
    public const CANDIDATES = 400;

    public function __construct(
        private RequestAccessPolicy $access,
        private ServiceRequestRepository $requests,
        private SimilarRequestFinder $finder,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(FindSimilarRequestsQuery $query): array
    {
        if (!$this->access->canReadRequests()) {
            throw new AccessDeniedException('Reading requests requires the admin.request.read permission.');
        }
        $target = $this->requests->findById($query->requestId) ?? throw new NotFoundException('Request not found.');
        $group = $target->groupId() !== null ? $this->requests->findByGroup($target->groupId()) : [];
        $groupIds = array_flip(array_map(fn (ServiceRequest $request) => $request->id, $group));
        $since = $this->clock->now()->modify(sprintf('-%d days', SimilarRequestFinder::WINDOW_DAYS));
        $candidates = array_values(array_filter(
            $this->requests->findOpenSince($since, self::CANDIDATES),
            fn (ServiceRequest $request) => !isset($groupIds[$request->id]),
        ));
        $found = $this->finder->find($target, $candidates);

        return [
            'requestId' => $target->id,
            'source' => $found['source'],
            'topic' => $found['topic'],
            'groupId' => $target->groupId(),
            'group' => array_values(array_map(
                fn (ServiceRequest $request) => $this->summary($request) + ['score' => null, 'reasons' => []],
                array_filter($group, fn (ServiceRequest $request) => $request->id !== $target->id),
            )),
            'items' => array_map(
                fn (array $item) => $this->summary($item['request']) + ['score' => $item['score'], 'reasons' => $item['reasons']],
                $found['items'],
            ),
        ];
    }

    /** @return array<string, mixed> */
    private function summary(ServiceRequest $request): array
    {
        return [
            'id' => $request->id,
            'reference' => $request->reference,
            'type' => $request->type,
            'subject' => $request->subject,
            'status' => $request->status(),
            'priority' => $request->priority(),
            'category' => $request->category(),
            'district' => $request->district(),
            'createdAt' => $request->createdAt->format(\DateTimeInterface::ATOM),
            'groupId' => $request->groupId(),
        ];
    }
}
