<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Platform;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F77 (ADR 012) : état de la plateforme, normal ou **mode allégé** (dégradé).
 *
 * Trois sources, par ordre de priorité :
 * 1. variable d'environnement `PLATFORM_DEGRADED=on` (forcé au déploiement) ;
 * 2. interrupteur manuel `app:platform:degraded on|off` ;
 * 3. détection automatique : au-delà de `slowThreshold` réponses lentes ou en erreur 5xx dans la minute,
 *    le mode allégé s'active pour `autoMinutes` minutes, puis se lève seul si la charge retombe.
 * L'état vit dans un pool de cache (fichiers par défaut, partagé par tous les processus PHP du serveur) :
 * aucune requête SQL n'est ajoutée au chemin critique d'une API déjà surchargée.
 */
final class PlatformState
{
    private const MANUAL_KEY = 'platform.manual';
    private const AUTO_KEY = 'platform.auto';

    /** @var array<string, mixed>|null */
    private ?array $memo = null;

    public function __construct(
        #[Autowire(service: 'platform.state.cache')] private readonly CacheItemPoolInterface $cache,
        #[Autowire('%env(PLATFORM_DEGRADED)%')] private readonly string $env = 'auto',
        #[Autowire('%env(int:PLATFORM_SLOW_THRESHOLD)%')] private readonly int $slowThreshold = 40,
        #[Autowire('%env(int:PLATFORM_AUTO_MINUTES)%')] private readonly int $autoMinutes = 5,
    ) {}

    /** @return array{mode: string, source: ?string, since: ?string, reason: string, until: ?string} */
    public function current(): array
    {
        if ($this->memo !== null) {
            return $this->memo;
        }
        $normal = ['mode' => 'normal', 'source' => null, 'since' => null, 'reason' => '', 'until' => null];
        if (strtolower($this->env) === 'on') {
            return $this->memo = ['mode' => 'degraded', 'source' => 'env', 'since' => null, 'reason' => 'Mode allégé activé par la configuration du serveur.', 'until' => null];
        }
        try {
            $manual = $this->cache->getItem(self::MANUAL_KEY);
            if ($manual->isHit() && is_array($manual->get())) {
                $value = $manual->get();

                return $this->memo = ['mode' => 'degraded', 'source' => 'manual', 'since' => $value['since'] ?? null, 'reason' => (string) ($value['reason'] ?? ''), 'until' => null];
            }
            if (strtolower($this->env) !== 'off') {
                $auto = $this->cache->getItem(self::AUTO_KEY);
                if ($auto->isHit() && is_array($auto->get()) && ($auto->get()['until'] ?? 0) > time()) {
                    $value = $auto->get();

                    return $this->memo = ['mode' => 'degraded', 'source' => 'auto', 'since' => $value['since'] ?? null, 'reason' => (string) ($value['reason'] ?? ''), 'until' => date(DATE_ATOM, (int) $value['until'])];
                }
            }
        } catch (\Throwable) {
            // Cache illisible : on reste en mode normal.
        }

        return $this->memo = $normal;
    }

    public function isDegraded(): bool
    {
        return $this->current()['mode'] === 'degraded';
    }

    public function enable(string $reason): void
    {
        $item = $this->cache->getItem(self::MANUAL_KEY);
        $item->set(['since' => date(DATE_ATOM), 'reason' => $reason !== '' ? $reason : 'Mode allégé activé par l’équipe technique.']);
        $this->cache->save($item);
        $this->memo = null;
    }

    /** Lève l'interrupteur manuel et la détection en cours (la détection automatique reste active). */
    public function disable(): void
    {
        $this->cache->deleteItems([self::MANUAL_KEY, self::AUTO_KEY]);
        $this->memo = null;
    }

    /** Compte une réponse lente ou en erreur ; déclenche le mode allégé automatique au-delà du seuil. */
    public function recordStrain(): void
    {
        if ($this->slowThreshold <= 0) {
            return;
        }
        try {
            $minute = intdiv(time(), 60);
            $item = $this->cache->getItem('platform.strain.'.$minute);
            $count = ($item->isHit() ? (int) $item->get() : 0) + 1;
            $item->set($count)->expiresAfter(180);
            $this->cache->save($item);
            if ($count === $this->slowThreshold) {
                $auto = $this->cache->getItem(self::AUTO_KEY);
                $auto->set([
                    'since' => date(DATE_ATOM),
                    'until' => time() + 60 * max(1, $this->autoMinutes),
                    'reason' => sprintf('Forte affluence détectée : %d réponses lentes ou en erreur en une minute.', $count),
                ])->expiresAfter(60 * max(1, $this->autoMinutes));
                $this->cache->save($auto);
                $this->memo = null;
            }
        } catch (\Throwable) {
            // La mesure de charge ne doit jamais faire échouer une requête.
        }
    }

    /** Valeur à donner à `Retry-After` en mode allégé. */
    public function retryAfterSeconds(): int
    {
        $until = $this->current()['until'];
        if ($until !== null) {
            return max(30, strtotime($until) - time());
        }

        return 300;
    }
}
