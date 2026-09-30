<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Command\RegisterUser\RegisterUserCommand;
use IAM\Application\Command\RegisterUser\RegisterUserCommandHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final readonly class AuthController
{
    #[Route('/api/auth/register', methods: ['POST'])]
    public function register(Request $request, RegisterUserCommandHandler $handler): JsonResponse
    {
        $payload = $request->toArray();
        $user = $handler(new RegisterUserCommand((string) ($payload['email'] ?? ''), (string) ($payload['password'] ?? '')));

        return new JsonResponse(['id' => $user->id(), 'email' => $user->getUserIdentifier()], 201);
    }
}
