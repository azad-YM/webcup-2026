<?php

declare(strict_types=1);

namespace IAM\Application\Command\RequestLoginLink;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\LoginLinkRepository;
use IAM\Application\Ports\Service\AccountMailer;
use IAM\Application\Ports\Service\ClientContext;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use IAM\Application\Ports\Service\SecretGenerator;
use IAM\Application\Service\Outcome;
use IAM\Domain\Entity\LoginLink;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * D02 : envoie un lien de connexion à usage unique. La réponse est identique que le compte existe ou non
 * (aucune énumération) : un secret de navigateur est toujours renvoyé, un e-mail n'est envoyé qu'à un compte
 * actif ayant une adresse, dans la limite de 3 liens par quart d'heure.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class RequestLoginLinkHandler
{
    public function __construct(
        private IUserRepository $users,
        private LoginLinkRepository $links,
        private LoginAttemptLimiter $limiter,
        private SecretGenerator $secrets,
        private AccountMailer $mailer,
        private ClientContext $client,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(RequestLoginLinkCommand $cmd): array
    {
        $email = strtolower(trim($cmd->email));
        $ip = $this->client->ip();
        $retryAfter = $this->limiter->retryAfter($email, $ip);
        if ($retryAfter > 0) {
            $minutes = max(1, (int) ceil($retryAfter / 60));

            return Outcome::failure(429, 'login_throttled', sprintf('Trop de tentatives de connexion. Réessayez dans %d minute%s.', $minutes, $minutes > 1 ? 's' : ''), ['retryAfter' => $retryAfter]);
        }
        // Chaque demande compte au seuil de l'adresse IP (F37) : pas d'envoi massif depuis une même adresse.
        $this->limiter->recordFailure('', $ip);

        $now = $this->clock->now()->getTimestamp();
        $browserSecret = $this->secrets->token();
        $user = $this->users->findByEmail($email);
        $to = $user?->isActive() ? $user->contactEmail() : null;
        if ($user !== null && $to !== null && $this->links->countSince($user->getId(), $now - LoginLink::WINDOW) < LoginLink::MAX_PER_WINDOW) {
            $token = $this->secrets->token();
            $this->links->save(new LoginLink(hash('sha256', $token), $user->getId(), hash('sha256', $browserSecret), $now, $now + LoginLink::LIFETIME));
            $this->mailer->sendLoginLink($to, $token, (int) (LoginLink::LIFETIME / 60));
        }

        return ['sent' => true, 'browserSecret' => $browserSecret, 'expiresIn' => LoginLink::LIFETIME];
    }
}
