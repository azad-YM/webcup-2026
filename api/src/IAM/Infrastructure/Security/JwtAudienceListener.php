<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: Events::JWT_DECODED)]
final class JwtAudienceListener
{
    public function __invoke(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();
        if (isset($payload['aud']) && !in_array((array) $payload['aud'], [['site'], ['admin']], true)) {
            $event->markAsInvalid();
        }
    }
}
