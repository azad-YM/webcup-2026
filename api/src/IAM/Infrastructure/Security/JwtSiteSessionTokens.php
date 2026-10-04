<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Application\Ports\Service\SiteSessionTokens;
use IAM\Domain\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/** Même émission que la connexion par mot de passe : audience `site`, `uid` et `sv` ajoutés par `AccountSessionListener`. */
final readonly class JwtSiteSessionTokens implements SiteSessionTokens
{
    public function __construct(private JWTTokenManagerInterface $jwt, private TokenStorageInterface $tokens) {}

    public function issue(User $user, ?string $deviceId): string
    {
        $payload = ['aud' => 'site'];
        if ($deviceId !== null) {
            $payload['did'] = $deviceId;
        }

        return $this->jwt->createFromPayload($user, $payload);
    }

    public function currentDeviceId(): ?string
    {
        $token = $this->tokens->getToken();
        if ($token === null) {
            return null;
        }
        try {
            $claims = $this->jwt->decode($token);
        } catch (\Throwable) {
            return null;
        }
        $deviceId = is_array($claims) ? ($claims['did'] ?? null) : null;

        return is_string($deviceId) ? $deviceId : null;
    }
}
