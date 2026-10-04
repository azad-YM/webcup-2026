<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListAnomalies;

use Audit\Application\Command\ScanUnusualActivity\ScanUnusualActivityHandler;
use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Application\Service\AnomalyView;
use Audit\Application\Service\UnusualActivityDetector;
use Audit\Domain\Entity\Anomaly;
use Psr\Cache\CacheItemPoolInterface;
use Shared\Application\Ports\Service\AbuseSignals;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListAnomaliesHandler
{
    public const LIMIT = 200;

    public function __construct(
        private AuditAccessPolicy $access,
        private AnomalyRepository $anomalies,
        private AbuseSignals $abuse,
        private IClock $clock,
        #[Autowire(service: 'cache.app')] private CacheItemPoolInterface $cache,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ListAnomaliesQuery $query): array
    {
        if (!$this->access->canReadSecurityEntries()) {
            throw new AccessDeniedException('L’écran « Activité inhabituelle » exige la permission admin.security.read.');
        }
        $status = in_array($query->status, Anomaly::STATUSES, true) ? $query->status : null;
        $severity = in_array($query->severity, Anomaly::SEVERITIES, true) ? $query->severity : null;
        $signals = $this->abuse->countsSince($this->clock->now()->modify('-24 hours'));
        try {
            $item = $this->cache->getItem(ScanUnusualActivityHandler::LAST_SCAN_KEY);
            $lastScanAt = $item->isHit() ? (string) $item->get() : null;
        } catch (\Throwable) {
            $lastScanAt = null;
        }

        return [
            'items' => array_map(AnomalyView::of(...), $this->anomalies->search($status, $severity, self::LIMIT)),
            'counters' => $this->anomalies->counters(),
            'signals' => [
                'formRejected' => $signals[AbuseSignals::FORM_REJECTED] ?? 0,
                'formChallenged' => $signals[AbuseSignals::FORM_CHALLENGED] ?? 0,
                'rateLimited' => $signals[AbuseSignals::RATE_LIMITED] ?? 0,
            ],
            'rules' => UnusualActivityDetector::RULES,
            'lastScanAt' => $lastScanAt,
        ];
    }
}
