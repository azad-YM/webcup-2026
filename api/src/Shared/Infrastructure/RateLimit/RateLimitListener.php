<?php

declare(strict_types=1);

namespace Shared\Infrastructure\RateLimit;

use Shared\Application\Ports\Service\AbuseSignals;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F69 : limite les points d'entrée sensibles (inscription, envoi de demande, inquiétude, réservation…) par adresse
 * IP. Les règles sont déclarées dans `config/packages/security_hardening.yaml` (`app.rate_limits`, par nom de
 * route) : Shared ne connaît aucun BC. Après le routage, avant le pare-feu. Réponse `429` expliquée en français,
 * avec l'en-tête `Retry-After`.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 16)]
final readonly class RateLimitListener
{
    /** @param array<string, array{limit: int, window: int, action: string}> $rules */
    public function __construct(
        private DatabaseRateLimiter $limiter,
        #[Autowire('%app.rate_limits%')] private array $rules,
        #[Autowire('%app.rate_limit_enabled%')] private bool $enabled = true,
        private ?AbuseSignals $signals = null,
    ) {}

    public function __invoke(RequestEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');
        if (!is_string($route) || !isset($this->rules[$route]) || in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $rule = $this->rules[$route];
        $client = (string) ($request->getClientIp() ?? 'inconnu');
        $retryAfter = $this->limiter->consume($route, $client, (int) $rule['limit'], (int) $rule['window']);
        if ($retryAfter === null) {
            return;
        }
        // F85 (ADR 012) : une rafale refusée devient un signal lu par le détecteur d'activité inhabituelle.
        $this->signals?->record(AbuseSignals::RATE_LIMITED, $route, $client);
        $minutes = (int) ceil($retryAfter / 60);
        throw new TooManyRequestsHttpException($retryAfter, sprintf(
            'Trop de tentatives pour %s en peu de temps. Pour protéger vos données, patientez %s avant de réessayer.',
            $rule['action'],
            $minutes <= 1 ? 'une minute' : $minutes . ' minutes',
        ));
    }
}
