<?php

declare(strict_types=1);

namespace IAM\Application\Command\ResendSignInCode;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\VerificationChallengeRepository;
use IAM\Application\Ports\Service\AccountMailer;
use IAM\Application\Ports\Service\SecretGenerator;
use IAM\Application\Service\IdentityReconfirmation;
use IAM\Application\Service\Outcome;
use IAM\Domain\Entity\VerificationChallenge;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F53 : nouveau code pour la même connexion (2 renvois au plus, une minute d'écart). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ResendSignInCodeHandler
{
    public function __construct(
        private VerificationChallengeRepository $challenges,
        private IUserRepository $users,
        private SecretGenerator $secrets,
        private AccountMailer $mailer,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ResendSignInCodeCommand $cmd): array
    {
        $now = $this->clock->now()->getTimestamp();
        $challenge = $this->challenges->find(hash('sha256', $cmd->challengeId));
        $email = $challenge !== null ? $this->users->findById($challenge->userId)?->contactEmail() : null;
        if ($challenge === null || $challenge->purpose !== VerificationChallenge::SIGN_IN || $email === null) {
            return Outcome::failure(410, 'challenge_expired', 'Cette connexion n’est plus en cours. Recommencez la connexion.');
        }
        $wait = $challenge->resendDelay($now);
        if ($wait < 0) {
            return Outcome::failure(429, 'resend_exhausted', 'Vous ne pouvez plus demander de nouveau code pour cette connexion. Recommencez la connexion.');
        }
        if ($wait > 0) {
            return Outcome::failure(429, 'resend_too_soon', sprintf('Patientez %d secondes avant de demander un nouveau code.', $wait), ['retryAfter' => $wait]);
        }
        $code = $this->secrets->code();
        $challenge->resend(IdentityReconfirmation::codeHash($cmd->challengeId, $code), $now);
        $this->challenges->save($challenge);
        $this->mailer->sendVerificationCode($email, $code, VerificationChallenge::SIGN_IN, (int) (VerificationChallenge::LIFETIME / 60));

        return ['sent' => true, 'expiresIn' => VerificationChallenge::LIFETIME, 'remainingSends' => $challenge->remainingSends()];
    }
}
