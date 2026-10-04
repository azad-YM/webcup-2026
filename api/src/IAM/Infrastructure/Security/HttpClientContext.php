<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Application\Ports\Service\ClientContext;
use Symfony\Component\HttpFoundation\RequestStack;

/** Adresse IP (`Request::getClientIp()`, voir `trusted_proxies`) et User-Agent de la requête principale. */
final readonly class HttpClientContext implements ClientContext
{
    public function __construct(private RequestStack $requests) {}

    public function ip(): string { return $this->requests->getMainRequest()?->getClientIp() ?? 'unknown'; }

    public function userAgent(): ?string
    {
        $agent = $this->requests->getMainRequest()?->headers->get('User-Agent');

        return $agent !== null ? mb_substr($agent, 0, 512) : null;
    }
}
