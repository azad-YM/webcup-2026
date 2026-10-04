<?php

declare(strict_types=1);

namespace Communication\Application\Query\GetMyNotifications;

use Communication\Application\Ports\Provider\AudienceProvider;
use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Application\Query\AlertOrdering;
use Communication\Domain\Entity\Alert;
use Communication\Domain\Entity\Publication;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Notifications of the connected citizen (F29, F30, F31): active alerts that concern them
 * (everyone, their district, health alerts if they consented) and the latest important announcements.
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyNotificationsHandler
{
    private const ANNOUNCEMENTS = 10;

    public function __construct(
        private AlertRepository $alerts,
        private PublicationRepository $publications,
        private AudienceProvider $audiences,
        private IClock $clock,
    ) {}

    /** @return array{alerts: list<array<string, mixed>>, announcements: list<array<string, mixed>>} */
    public function __invoke(GetMyNotificationsQuery $query): array
    {
        $audience = $this->audiences->current() ?? throw new NotFoundException('The current account is not a citizen.');
        $now = $this->clock->now();
        $alerts = array_filter(
            $this->alerts->all(),
            fn (Alert $alert) => $alert->isActive($now) && $alert->concerns($audience->district, $audience->healthConsent),
        );
        $announcements = array_filter($this->publications->all(), fn (Publication $p) => $p->isPublished() && $p->isImportant());
        usort($announcements, fn (Publication $a, Publication $b) => $b->publishedAt() <=> $a->publishedAt());

        return [
            'alerts' => AlertOrdering::views($alerts),
            'announcements' => array_map(fn (Publication $p) => $p->publicView(), array_slice($announcements, 0, self::ANNOUNCEMENTS)),
        ];
    }
}
