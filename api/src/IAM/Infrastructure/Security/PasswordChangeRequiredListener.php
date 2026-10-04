<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Domain\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F71: while a resident account still has its provisional access code, the API only answers the
 * routes needed to choose a new code (profile, password change) and the public content. Runs after
 * the firewall (priority 8).
 */
final readonly class PasswordChangeRequiredListener
{
    private const ALLOWED = '#^/api/(iam/me(/password|/spaces)?$|login_check$|administration/(services|districts)|communication/|realtime/)#';

    public function __construct(private Security $security) {}

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 4)]
    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) return;
        $path = $event->getRequest()->getPathInfo();
        if (!str_starts_with($path, '/api/') || preg_match(self::ALLOWED, $path)) return;
        $user = $this->security->getUser();
        if (!$user instanceof User || !$user->passwordChangeRequired()) return;
        $event->setResponse(new JsonResponse([
            'error' => 'Choisissez d’abord votre nouveau code personnel pour continuer.',
            'code' => 'password_change_required',
        ], 403));
    }
}
