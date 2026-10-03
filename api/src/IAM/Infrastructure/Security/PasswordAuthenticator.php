<?php

namespace IAM\Infrastructure\Security;

use IAM\Application\Command\LoginWithCredentials\LoginWithCredentialsHandler;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class PasswordAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private LoginWithCredentialsHandler $commandHandler,
        private JWTTokenManagerInterface $jwtManager,
        private LoginAttemptLimiter $limiter,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->isMethod('POST') && $request->getPathInfo() === '/api/login_check';
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        [$email, $password] = $this->credentials($request);
        $ip = $request->getClientIp() ?? 'unknown';
        $retryAfter = $this->limiter->retryAfter($email ?? '', $ip);
        if ($retryAfter > 0) throw new LoginThrottledException($retryAfter);

        try {
            $user = ($this->commandHandler)($email, $password);
        } catch (BadCredentialsException $exception) {
            $lock = $this->limiter->recordFailure($email ?? '', $ip);
            if ($lock > 0) throw new LoginThrottledException($lock);
            throw $exception;
        }
        return new SelfValidatingPassport(
            new UserBadge($user->getUserIdentifier(), fn($email) => $user),
        );
    }

    public function onAuthenticationSuccess(
        Request $request,
        TokenInterface $token,
        string $firewallName,
    ): JsonResponse {
        [$email] = $this->credentials($request);
        $this->limiter->recordSuccess($email ?? '', $request->getClientIp() ?? 'unknown');
        $jwt = $this->jwtManager->createFromPayload($token->getUser(), ['aud' => 'site']);
        return new JsonResponse(['token' => $jwt]);
    }

    public function onAuthenticationFailure(
        Request $request,
        AuthenticationException $exception,
    ): JsonResponse {
        if ($exception instanceof LoginThrottledException) {
            $minutes = max(1, (int) ceil($exception->retryAfter / 60));
            return new JsonResponse([
                'error' => sprintf('Trop de tentatives de connexion. Réessayez dans %d minute%s.', $minutes, $minutes > 1 ? 's' : ''),
                'code' => 'login_throttled',
                'retryAfter' => $exception->retryAfter,
            ], 429, ['Retry-After' => (string) $exception->retryAfter]);
        }
        if ($exception instanceof AccountStatusException) {
            return new JsonResponse(['error' => $exception->getMessageKey(), 'code' => 'account_suspended'], 403);
        }
        return new JsonResponse(['error' => 'Identifiants invalides.'], 401);
    }

    /** @return array{0: ?string, 1: ?string} */
    private function credentials(Request $request): array
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) return [null, null];
        return [
            is_string($data['email'] ?? null) ? $data['email'] : null,
            is_string($data['password'] ?? null) ? $data['password'] : null,
        ];
    }
}
