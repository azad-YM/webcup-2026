<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Platform;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F77 (ADR 012) : en mode allégé, les fonctions **non essentielles** répondent `503` avec `Retry-After` et un
 * message en français (assistant IA, temps réel, statistiques…, préfixes déclarés dans
 * `config/packages/platform.yaml`, `app.platform.non_essential`). L'essentiel reste servi : alertes, urgences,
 * services, envoi de demandes. Toute réponse porte `X-Platform-Mode` pour que les écrans affichent le bandeau.
 *
 * Après la réponse (`kernel.terminate`), chaque requête lente ou en erreur 5xx alimente la détection automatique.
 * Le flux SSE, long par construction, n'est pas mesuré.
 */
final readonly class DegradedModeListener
{
    public const MESSAGE = 'Service en mode allégé : cette fonction est suspendue quelques minutes pour garder l’essentiel disponible (alertes, urgences, services et envoi de demandes). Réessayez un peu plus tard.';

    /** @param list<string> $nonEssential */
    public function __construct(
        private PlatformState $state,
        #[Autowire('%app.platform.non_essential%')] private array $nonEssential,
        #[Autowire('%env(int:PLATFORM_SLOW_MS)%')] private int $slowMs = 2500,
    ) {}

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 31)]
    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest() || $event->getRequest()->getMethod() === 'OPTIONS' || !$this->state->isDegraded()) {
            return;
        }
        $path = $event->getRequest()->getPathInfo();
        foreach ($this->nonEssential as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $retryAfter = $this->state->retryAfterSeconds();
                $event->setResponse(new JsonResponse(
                    ['code' => 'degraded_mode', 'error' => self::MESSAGE, 'retryAfter' => $retryAfter],
                    503,
                    ['Retry-After' => (string) $retryAfter],
                ));

                return;
            }
        }
    }

    #[AsEventListener(event: KernelEvents::RESPONSE, priority: -5)]
    public function onResponse(ResponseEvent $event): void
    {
        if ($event->isMainRequest()) {
            $event->getResponse()->headers->set('X-Platform-Mode', $this->state->isDegraded() ? 'degraded' : 'normal');
        }
    }

    #[AsEventListener(event: KernelEvents::TERMINATE)]
    public function onTerminate(TerminateEvent $event): void
    {
        $request = $event->getRequest();
        if ($request->attributes->get('_route') === 'realtime_stream') {
            return;
        }
        $started = (float) $request->server->get('REQUEST_TIME_FLOAT', microtime(true));
        $elapsedMs = (microtime(true) - $started) * 1000;
        if ($event->getResponse()->getStatusCode() >= 500 && $event->getResponse()->getStatusCode() !== 503 || $elapsedMs >= $this->slowMs) {
            $this->state->recordStrain();
        }
    }
}
