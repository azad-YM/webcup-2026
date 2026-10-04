<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Http;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F69 (ADR 007) : en-têtes de sécurité de l'API. L'API ne sert que du JSON et un flux SSE : aucune page ne doit
 * être interprétée, encadrée ni mise en cache lorsqu'elle porte des données personnelles.
 */
#[AsEventListener(event: KernelEvents::RESPONSE, priority: -10)]
final readonly class SecurityHeadersListener
{
    public function __construct(#[Autowire('%kernel.environment%')] private string $environment) {}

    public function __invoke(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $headers = $event->getResponse()->headers;
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('Referrer-Policy', 'no-referrer');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        if (!$headers->has('Content-Security-Policy') && str_starts_with($request->getPathInfo(), '/api')) {
            $headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
        }
        // Une réponse authentifiée (données personnelles) n'est conservée par aucun cache intermédiaire ni navigateur.
        if ($request->headers->has('Authorization') && !str_contains((string) $headers->get('Content-Type'), 'text/event-stream')) {
            $headers->set('Cache-Control', 'no-store, private');
        }
        if ($this->environment === 'prod' && $request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
    }
}
