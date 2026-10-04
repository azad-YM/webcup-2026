<?php

declare(strict_types=1);

namespace Audit\Application\Command\ScanUnusualActivity;

use Audit\Application\Ports\Provider\AccountProtector;
use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Service\UnusualActivityDetector;
use Audit\Application\Ports\Repository\AnomalyRepository;
use Audit\Domain\Entity\Anomaly;
use Psr\Cache\CacheItemPoolInterface;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\RealtimePublisher;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F85 : analyse (toutes les 5 minutes par `app:security:scan`, ou à la demande).
 *
 * 1. Le détecteur applique ses règles aux signaux des BC (ports) ;
 * 2. chaque anomalie est créée ou actualisée par son empreinte ;
 * 3. **réaction** sur un compte attaqué : IAM verrouille 15 min, exige le code par e-mail 24 h et prévient le
 *    titulaire ; la réaction est inscrite dans l'anomalie et au journal (`audit.anomaly.protected`) ;
 * 4. une **nouvelle** anomalie grave est poussée en temps réel aux agents `admin.security.read`
 *    (`administration.security`, événement `security.anomaly_detected`).
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ScanUnusualActivityHandler
{
    public const TOPIC = 'administration.security';
    public const LAST_SCAN_KEY = 'audit.security.last_scan';

    public function __construct(
        private UnusualActivityDetector $detector,
        private AnomalyRepository $anomalies,
        private AccountProtector $protector,
        private AuditAccessPolicy $access,
        private IClock $clock,
        private IIdProvider $ids,
        private RealtimePublisher $realtime,
        #[Autowire(service: 'cache.app')] private CacheItemPoolInterface $cache,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array{detected: int, created: int, critical: int, reactions: int, scannedAt: string} */
    public function __invoke(ScanUnusualActivityCommand $command): array
    {
        if ($command->trigger !== 'schedule' && !$this->access->canReadSecurityEntries()) {
            throw new AccessDeniedException('L’analyse de l’activité inhabituelle exige la permission admin.security.read.');
        }
        $now = $this->clock->now();
        $created = 0;
        $critical = 0;
        $reactions = 0;
        $detected = $this->detector->detect($now);
        foreach ($detected as $found) {
            $fingerprint = hash('sha256', $found->fingerprint);
            $anomaly = $this->anomalies->findByFingerprint($fingerprint);
            $isNew = $anomaly === null;
            if ($anomaly === null) {
                $anomaly = Anomaly::detect($this->ids->getId(), $fingerprint, $found->rule, $found->category, $found->severity, $found->title, $found->explanation, $found->related, $now);
                ++$created;
            } else {
                $anomaly->observeAgain($found->severity, $found->explanation, $found->related, $now);
            }
            if ($found->protectAccountId !== null && ($isNew || $anomaly->reaction() === null)) {
                $result = $this->protector->protect($found->protectAccountId, $found->lockSeconds, 24, $found->title);
                if ($result->applied) {
                    $anomaly->recordReaction($result->description);
                    ++$reactions;
                    $this->audit?->record(
                        'audit.anomaly.protected',
                        'account',
                        $found->protectAccountId,
                        'Protection automatique d’un compte : '.$result->description,
                        ['rule' => $found->rule, 'lockedMinutes' => $result->lockedMinutes, 'codeRequired' => $result->codeRequired, 'holderWarned' => $result->holderWarned],
                        'Détection automatique',
                    );
                }
            }
            $this->anomalies->save($anomaly);
            if ($anomaly->severity() === Anomaly::CRITICAL) {
                ++$critical;
                if ($isNew) {
                    $this->realtime->publish(self::TOPIC, 'security.anomaly_detected', ['id' => $anomaly->id, 'severity' => $anomaly->severity(), 'title' => $anomaly->title()]);
                }
            }
        }
        try {
            $item = $this->cache->getItem(self::LAST_SCAN_KEY);
            $this->cache->save($item->set($now->format(DATE_ATOM)));
        } catch (\Throwable) {
            // Information d'affichage seulement.
        }

        return ['detected' => count($detected), 'created' => $created, 'critical' => $critical, 'reactions' => $reactions, 'scannedAt' => $now->format(DATE_ATOM)];
    }
}
