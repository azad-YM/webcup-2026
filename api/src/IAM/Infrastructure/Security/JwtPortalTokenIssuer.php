<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;
use IAM\Application\Ports\Service\PortalTokenIssuer;
use IAM\Application\Ports\Repository\IUserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Shared\Domain\Exception\AccessDeniedException;
final readonly class JwtPortalTokenIssuer implements PortalTokenIssuer
{
    public function __construct(private JWTTokenManagerInterface $jwt, private TokenStorageInterface $tokens, private IUserRepository $users) {}
    public function currentSession(): array
    {
        $token = $this->tokens->getToken();
        $claims = $token ? $this->jwt->decode($token) : false;
        if (!$claims || !isset($claims['exp']) || (array) ($claims['aud'] ?? 'site') !== ['site']) throw new AccessDeniedException('A site session is required.');
        return ['hash' => hash('sha256', $token->getCredentials()), 'expiresAt' => (int) $claims['exp']];
    }
    public function issue(string $userId, string $email, string $destination, int $expiresAt): string
    {
        $user = $this->users->findByEmail($email);
        if ($user === null || $user->getId() !== $userId) throw new AccessDeniedException('Account unavailable.');
        return $this->jwt->createFromPayload($user, ['aud' => $destination, 'exp' => $expiresAt]);
    }
}
