<?php

namespace IAM\Infrastructure\Security;

use IAM\Application\Command\CompleteSignIn\CompleteSignInCommand;
use IAM\Application\Command\LoginWithCredentials\LoginWithCredentialsHandler;
use IAM\Domain\Entity\User;
use IAM\Domain\Entity\SignInRecord;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AccountStatusException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class PasswordAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private LoginWithCredentialsHandler $commandHandler,
        private LoginAttemptLimiter $limiter,
        private MessageBusInterface $commandBus,
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
        $user = $token->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Identifiants invalides.'], 401);
        }
        // L15 : seconde étape éventuelle (code e-mail, F53), appareil reconnu (F54), puis JWT `site`.
        $data = json_decode($request->getContent(), true);
        $deviceId = is_array($data) && is_string($data['deviceId'] ?? null) ? $data['deviceId'] : null;
        $envelope = $this->commandBus->dispatch(new CompleteSignInCommand($user->getId(), SignInRecord::METHOD_PASSWORD, $deviceId));

        return new JsonResponse($envelope->last(HandledStamp::class)?->getResult());
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
