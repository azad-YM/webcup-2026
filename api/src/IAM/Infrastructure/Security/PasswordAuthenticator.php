<?php

namespace IAM\Infrastructure\Security;

use IAM\Application\Command\LoginWithCredentials\LoginWithCredentialsHandler;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class PasswordAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private LoginWithCredentialsHandler $commandHandler,
        private JWTTokenManagerInterface $jwtManager,
        private \IAM\Application\Ports\Service\LoginAttemptLimiter $limiter,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->isMethod('POST') && $request->getPathInfo() === '/api/login_check';
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $data = json_decode($request->getContent(), true);
        $email = is_array($data) && is_string($data['email'] ?? null) ? $data['email'] : null;
        $password = is_array($data) && is_string($data['password'] ?? null) ? $data['password'] : null;
        $retryAfter = $this->limiter->consume($email ?? '', $request->getClientIp() ?? 'unknown');
        if ($retryAfter > 0) throw new LoginThrottledException($retryAfter);

        $user = ($this->commandHandler)($email, $password);
        return new SelfValidatingPassport(
            new UserBadge($user->getUserIdentifier(), fn($email) => $user),
        );
    }

    public function onAuthenticationSuccess(
        Request $request,
        TokenInterface $token,
        string $firewallName,
    ): JsonResponse {
        $jwt = $this->jwtManager->createFromPayload($token->getUser(), ['aud' => 'site']);
        return new JsonResponse(['token' => $jwt]);
    }

    public function onAuthenticationFailure(
        Request $request,
        AuthenticationException $exception,
    ): JsonResponse {
        if ($exception instanceof LoginThrottledException) return new JsonResponse(['error' => 'Trop de tentatives de connexion. Réessayez dans quelques minutes.', 'retryAfter' => $exception->retryAfter], 429, ['Retry-After' => (string) $exception->retryAfter]);
        return new JsonResponse(['error' => 'Identifiants invalides.'], 401);
    }
}
