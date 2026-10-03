<?php

declare(strict_types=1);

namespace Communication\Application\Query\GetPublication;

use Communication\Application\Ports\Repository\PublicationRepository;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** A draft or withdrawn publication does not exist for the public. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetPublicationHandler
{
    public function __construct(private PublicationRepository $publications) {}

    /** @return array<string, mixed> */
    public function __invoke(GetPublicationQuery $query): array
    {
        $publication = $this->publications->find($query->id);
        if ($publication === null || !$publication->isPublished()) {
            throw new NotFoundException('Publication introuvable.');
        }

        return $publication->publicView();
    }
}
