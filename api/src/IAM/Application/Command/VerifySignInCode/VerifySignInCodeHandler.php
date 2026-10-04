<?php

declare(strict_types=1);

namespace IAM\Application\Command\VerifySignInCode;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\VerificationChallengeRepository;
use IAM\Application\Service\IdentityReconfirmation;
use IAM\Application\Service\Outcome;
use IAM\Application\Service\SignInFlow;
use IAM\Domain\Entity\VerificationChallenge;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F53 : seconde étape de la connexion, code à 6 chiffres reçu par e-mail (5 essais, 10 minutes). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class VerifySignInCodeHandler
{
    public function __construct(
        private VerificationChallengeRepository $challenges,
        private IUserRepository $users,
        private SignInFlow $flow,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(VerifySignInCodeCommand $cmd): array
    {
        $challenge = $this->challenges->find(hash('sha256', $cmd->challengeId));
        if ($challenge === null || $challenge->purpose !== VerificationChallenge::SIGN_IN) {
            return self::expired();
        }
        $result = $challenge->check(IdentityReconfirmation::codeHash($cmd->challengeId, $cmd->code), $this->clock->now()->getTimestamp());
        if ($result === VerificationChallenge::INVALID) {
            $this->challenges->save($challenge);
            $left = $challenge->remainingAttempts();

            return Outcome::failure(422, 'invalid_code', sprintf('Code incorrect. Il vous reste %d essai%s.', $left, $left > 1 ? 's' : ''), ['remainingAttempts' => $left]);
        }
        $this->challenges->remove($challenge);
        if ($result === VerificationChallenge::LOCKED) {
            return Outcome::failure(429, 'too_many_attempts', 'Trop d’essais. Par sécurité, ce code est annulé : recommencez la connexion pour en recevoir un nouveau.');
        }
        if ($result === VerificationChallenge::EXPIRED) {
            return self::expired();
        }
        $user = $this->users->findById($challenge->userId);
        if ($user === null || $user->status() === 'deleted') {
            return self::expired();
        }
        if (!$user->isActive()) {
            return Outcome::suspended();
        }

        return $this->flow->complete($user, (string) $challenge->method, $challenge->deviceHash, true, $cmd->trustDevice);
    }

    /** @return array<string, mixed> */
    private static function expired(): array
    {
        return Outcome::failure(410, 'challenge_expired', 'Ce code n’est plus valable (10 minutes). Recommencez la connexion pour recevoir un nouveau code.');
    }
}
