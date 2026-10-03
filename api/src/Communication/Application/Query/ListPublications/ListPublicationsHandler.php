<?php

declare(strict_types=1);

namespace Communication\Application\Query\ListPublications;

use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Domain\Entity\Publication;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Published publications, most recent first (public). */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListPublicationsHandler
{
    public function __construct(private PublicationRepository $publications) {}

    /** @return list<array<string, mixed>> */
    public function __invoke(ListPublicationsQuery $query): array
    {
        $published = array_filter(
            $this->publications->all(),
            fn (Publication $publication) => $publication->isPublished() && (!$query->importantOnly || $publication->isImportant()),
        );
        usort($published, fn (Publication $a, Publication $b) => $b->publishedAt() <=> $a->publishedAt());

        return array_map(fn (Publication $publication) => $publication->publicView(), $published);
    }
}
