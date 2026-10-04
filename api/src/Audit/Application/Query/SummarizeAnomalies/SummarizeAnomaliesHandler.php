<?php

declare(strict_types=1);

namespace Audit\Application\Query\SummarizeAnomalies;

use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Application\Service\AnomalySummaryWriter;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F85 : résumé du jour, conservé 10 minutes pour limiter les appels au modèle de langage. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class SummarizeAnomaliesHandler
{
    public function __construct(
        private AuditAccessPolicy $access,
        private AnomalyRepository $anomalies,
        private AnomalySummaryWriter $writer,
        private IClock $clock,
        #[Autowire(service: 'cache.app')] private CacheInterface $cache,
    ) {}

    /** @return array{text: string, source: string, generatedAt: string, count: int} */
    public function __invoke(SummarizeAnomaliesQuery $query): array
    {
        if (!$this->access->canReadSecurityEntries()) {
            throw new AccessDeniedException('Le résumé de l’activité inhabituelle exige la permission admin.security.read.');
        }
        $now = $this->clock->now();
        $anomalies = $this->anomalies->seenSince($now->modify('-24 hours'));
        $key = 'audit.anomaly_summary.'.md5(implode('|', array_map(static fn ($a): string => $a->id.$a->status().$a->occurrences(), $anomalies)));

        return $this->cache->get($key, function (ItemInterface $item) use ($anomalies, $now): array {
            $item->expiresAfter(600);

            return $this->writer->write($anomalies) + ['generatedAt' => $now->format(DATE_ATOM), 'count' => count($anomalies)];
        });
    }
}
