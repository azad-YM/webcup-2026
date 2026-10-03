<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Domain\Entity\User;
use IAM\Application\Ports\Repository\IUserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

final readonly class AccountSessionListener
{
    public function __construct(private IUserRepository $users) {}

    #[AsEventListener(event: Events::JWT_CREATED)]
    public function created(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) return;
        $payload = $event->getData();
        $payload['uid'] = $user->getId();
        $payload['sv'] = $user->sessionVersion();
        $event->setData($payload);
    }

    #[AsEventListener(event: Events::JWT_DECODED)]
    public function decoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();
        $id = $payload['uid'] ?? null;
        $version = $payload['sv'] ?? null;
        $user = is_string($id) ? $this->users->findById($id) : null;
        if (!$user || !$user->isActive() || !is_int($version) || $version !== $user->sessionVersion()) $event->markAsInvalid();
    }
}
