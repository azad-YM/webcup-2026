<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Http;

use Shared\Infrastructure\Platform\PlatformState;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\Cache\TagAwareCacheInterface;

/**
 * F78 (ADR 012) : lectures publiques mises en cache côté serveur et côté navigateur.
 *
 * Seules les routes déclarées dans `config/packages/platform.yaml` (`app.public_cache.routes`, nom de route →
 * durée en secondes) et les requêtes **anonymes** (sans `Authorization`) sont concernées : une réponse
 * personnalisée n'est jamais partagée. Shared ne connaît aucun BC : la route et le premier segment du chemin
 * (`/api/<segment>/…`) servent d'étiquette.
 *
 * - Lecture : réponse servie depuis le cache (`X-Cache: HIT`), avec `ETag` et `Cache-Control: public, max-age`,
 *   `304 Not Modified` si le navigateur a déjà la même version (`If-None-Match`).
 * - Écriture réussie (POST, PUT, PATCH, DELETE < 400) sur `/api/<segment>/…` : les lectures publiques de ce
 *   segment sont invalidées aussitôt. La durée courte borne le reste (publication programmée, fin d'alerte).
 * - Mode allégé (F77) : la durée est multipliée par 4 pour soulager la base.
 */
final readonly class PublicReadCacheListener
{
    private const ATTRIBUTE = '_public_cache';

    /** @param array<string, int> $routes */
    public function __construct(
        #[Autowire(service: 'public_read.cache')] private TagAwareCacheInterface $cache,
        private PlatformState $platform,
        #[Autowire('%app.public_cache.routes%')] private array $routes,
        #[Autowire('%app.public_cache.enabled%')] private bool $enabled = true,
    ) {}

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 14)]
    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');
        if (!$this->enabled || !$event->isMainRequest() || !$request->isMethod('GET') || !is_string($route) || !isset($this->routes[$route]) || $request->headers->has('Authorization')) {
            return;
        }
        $key = 'r'.hash('sha256', $route.'|'.$request->getPathInfo().'?'.$request->getQueryString().'|'.$request->getPreferredLanguage());
        $request->attributes->set(self::ATTRIBUTE, ['key' => $key, 'route' => $route, 'tag' => self::segment($request->getPathInfo())]);
        try {
            $item = $this->cache->getItem($key);
        } catch (\Throwable) {
            return;
        }
        if (!$item->isHit() || !is_array($item->get())) {
            return;
        }
        $cached = $item->get();
        $response = new Response((string) $cached['body'], 200, ['Content-Type' => (string) $cached['type']]);
        $response->headers->set('X-Cache', 'HIT');
        $this->decorate($response, $route, (string) $cached['etag']);
        $response->isNotModified($request);
        $request->attributes->set(self::ATTRIBUTE, null);
        $event->setResponse($response);
    }

    #[AsEventListener(event: KernelEvents::RESPONSE, priority: -15)]
    public function onResponse(ResponseEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $response = $event->getResponse();
        if (!$request->isMethod('GET') && !$request->isMethod('HEAD')) {
            if ($response->getStatusCode() < 400 && ($tag = self::segment($request->getPathInfo())) !== null) {
                try {
                    $this->cache->invalidateTags([$tag]);
                } catch (\Throwable) {
                    // Le cache expirera de lui-même (durée courte).
                }
            }

            return;
        }
        $context = $request->attributes->get(self::ATTRIBUTE);
        if (!is_array($context) || $response->getStatusCode() !== 200) {
            return;
        }
        $body = (string) $response->getContent();
        $etag = '"'.substr(hash('sha256', $body), 0, 32).'"';
        $ttl = $this->ttl($context['route']);
        try {
            $item = $this->cache->getItem($context['key']);
            $item->set(['body' => $body, 'etag' => $etag, 'type' => (string) $response->headers->get('Content-Type', 'application/json')]);
            $item->expiresAfter($ttl);
            if ($item instanceof ItemInterface && $context['tag'] !== null) {
                $item->tag([$context['tag']]);
            }
            $this->cache->save($item);
        } catch (\Throwable) {
            // Cache indisponible : la réponse est servie normalement.
        }
        $response->headers->set('X-Cache', 'MISS');
        $this->decorate($response, $context['route'], $etag);
        $response->isNotModified($request);
    }

    private function decorate(Response $response, string $route, string $etag): void
    {
        $ttl = $this->ttl($route);
        $response->headers->set('ETag', $etag);
        $response->headers->set('Cache-Control', sprintf('public, max-age=%d, stale-while-revalidate=%d', $ttl, $ttl * 2));
        $response->headers->set('Vary', 'Authorization, Accept-Language');
    }

    private function ttl(string $route): int
    {
        $ttl = max(1, (int) ($this->routes[$route] ?? 30));

        return $this->platform->isDegraded() ? $ttl * 4 : $ttl;
    }

    private static function segment(string $path): ?string
    {
        return preg_match('#^/api/([a-z0-9-]+)/#', $path, $match) === 1 ? 'seg-'.$match[1] : null;
    }
}
