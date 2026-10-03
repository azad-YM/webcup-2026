<?php

declare(strict_types=1);

namespace Pilotage\Domain\Model;

/** Snapshot of the Webcup feed at the time it was fetched from the contest API. */
final readonly class WebcupFeed
{
    /** @var list<WebcupRequest> */
    public array $requests;

    /** @param list<WebcupRequest> $requests */
    public function __construct(
        public WebcupSession $session,
        array $requests,
        public \DateTimeImmutable $fetchedAt,
    ) {
        $this->requests = self::sorted($requests);
    }

    /** XP still available on the visible requests (`xpAvailable`, or `xpTotal` when the API omits it). */
    public function totalXpAvailable(): int
    {
        return array_sum(array_map(static fn (WebcupRequest $request): int => $request->xpAvailable ?? $request->xpTotal, $this->requests));
    }

    /**
     * Requests follow the API `sort_order`; those without one come last, by arrival then code.
     *
     * @param list<WebcupRequest> $requests
     * @return list<WebcupRequest>
     */
    private static function sorted(array $requests): array
    {
        usort($requests, static fn (WebcupRequest $a, WebcupRequest $b): int => [
            $a->sortOrder === null, $a->sortOrder ?? 0, $a->arrivalTime ?? '', $a->requestCode,
        ] <=> [
            $b->sortOrder === null, $b->sortOrder ?? 0, $b->arrivalTime ?? '', $b->requestCode,
        ]);

        return array_values($requests);
    }
}
