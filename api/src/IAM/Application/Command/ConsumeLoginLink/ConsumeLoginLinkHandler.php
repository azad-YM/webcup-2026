<?php

declare(strict_types=1);

namespace IAM\Application\Command\ConsumeLoginLink;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\LoginLinkRepository;
use IAM\Application\Ports\Service\ClientContext;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use IAM\Application\Service\Outcome;
use IAM\Application\Service\SignInFlow;
use IAM\Domain\Entity\SignInRecord;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * D02 : échange un lien de connexion contre la session habituelle. Il faut le jeton du lien **et** le secret
 * gardé par le navigateur qui l'a demandé : un lien transféré ou intercepté ne suffit pas (il reste alors
 * utilisable dans le bon navigateur). Mêmes contrôles que le mot de passe : limiteur, compte suspendu,
 * vérification supplémentaire (F53), appareil (F54).
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ConsumeLoginLinkHandler
{
    public function __construct(
        private LoginLinkRepository $links,
        private IUserRepository $users,
        private LoginAttemptLimiter $limiter,
        private ClientContext $client,
        private SignInFlow $flow,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ConsumeLoginLinkCommand $cmd): array
    {
        $ip = $this->client->ip();
        if ($this->limiter->retryAfter('', $ip) > 0) {
            return Outcome::failure(429, 'login_throttled', 'Trop de tentatives de connexion depuis cette adresse. Réessayez dans quelques minutes.');
        }
        $link = $this->links->find(hash('sha256', $cmd->token));
        if ($link === null || $link->isExpired($this->clock->now()->getTimestamp())) {
            $this->limiter->recordFailure('', $ip);

            return self::invalid();
        }
        if (!$link->matchesBrowser(hash('sha256', $cmd->browserSecret))) {
            $this->limiter->recordFailure('', $ip);

            return Outcome::failure(403, 'other_browser', 'Ce lien doit être ouvert dans le navigateur où vous l’avez demandé. Ouvrez-le sur le même appareil, avec le même navigateur, ou demandez un nouveau lien depuis cet appareil.');
        }
        $user = $this->users->findById($link->userId);
        if ($user === null || $user->status() === 'deleted' || !$this->links->consume($link)) {
            return self::invalid();
        }
        $email = (string) $user->contactEmail();
        if ($this->limiter->retryAfter($email, $ip) > 0) {
            return Outcome::failure(429, 'login_throttled', 'Trop de tentatives de connexion sur ce compte. Réessayez dans quelques minutes.');
        }
        if (!$user->isActive()) {
            return Outcome::suspended();
        }
        $this->limiter->recordSuccess($email, $ip);

        return $this->flow->begin($user, SignInRecord::METHOD_LINK, $cmd->deviceId);
    }

    /** @return array<string, mixed> */
    private static function invalid(): array
    {
        return Outcome::failure(410, 'link_invalid', 'Ce lien n’est plus valable : il a déjà servi ou a dépassé ses 10 minutes de validité. Demandez un nouveau lien.');
    }
}
