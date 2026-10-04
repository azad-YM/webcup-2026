<?php

declare(strict_types=1);

namespace IAM\Application\Service;

use IAM\Application\Ports\Repository\VerificationChallengeRepository;
use IAM\Application\Ports\Service\AccountMailer;
use IAM\Application\Ports\Service\SecretGenerator;
use IAM\Domain\Entity\User;
use IAM\Domain\Entity\VerificationChallenge;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Confirmation d'identité d'un compte déjà connecté avant une action sensible (F53 : activer ou désactiver la
 * vérification supplémentaire ; F55 : exporter ses données) : mot de passe, ou code à 6 chiffres reçu par e-mail.
 * Un essai de code manqué est enregistré : l'appelant ne doit pas annuler sa transaction sur un refus.
 */
final readonly class IdentityReconfirmation
{
    public const OK = 'ok';
    public const INVALID_PASSWORD = 'invalid_password';
    public const INVALID_CODE = 'invalid_code';
    public const EXPIRED = 'expired';
    public const LOCKED = 'locked';
    public const MISSING = 'missing';

    public function __construct(
        private VerificationChallengeRepository $challenges,
        private SecretGenerator $secrets,
        private AccountMailer $mailer,
        private IClock $clock,
        private UserPasswordHasherInterface $hasher,
    ) {}

    /**
     * Envoie un code de confirmation ; remplace le précédent. Refus contractuel (Outcome) si le compte n'a pas
     * d'e-mail ou si un code vient d'être envoyé (moins d'une minute).
     *
     * @return array<string, mixed>
     */
    public function issue(User $user): array
    {
        $email = $user->contactEmail();
        if ($email === null) {
            return Outcome::failure(422, 'email_unavailable', 'Ce compte n’a pas d’adresse e-mail : le code ne peut pas être envoyé. Utilisez votre mot de passe ou adressez-vous à l’accueil de la mairie.');
        }
        $now = $this->clock->now()->getTimestamp();
        $previous = $this->challenges->findForUser($user->getId(), VerificationChallenge::RECONFIRM);
        if ($previous !== null) {
            $wait = $previous->resendDelay($now);
            if ($wait > 0) {
                return Outcome::failure(429, 'resend_too_soon', sprintf('Un code vient d’être envoyé. Patientez %d secondes avant d’en demander un autre.', $wait), ['retryAfter' => $wait]);
            }
            $this->challenges->remove($previous);
        }
        $challengeId = $this->secrets->token();
        $code = $this->secrets->code();
        $this->challenges->save(new VerificationChallenge(hash('sha256', $challengeId), $user->getId(), VerificationChallenge::RECONFIRM, self::codeHash($challengeId, $code), $now, $now + VerificationChallenge::LIFETIME));
        $this->mailer->sendVerificationCode($email, $code, VerificationChallenge::RECONFIRM, (int) (VerificationChallenge::LIFETIME / 60));

        return ['challengeId' => $challengeId, 'emailHint' => self::maskEmail($email), 'expiresIn' => VerificationChallenge::LIFETIME];
    }

    /** @return array{0: string, 1: int} résultat et essais restants */
    public function verify(User $user, ?string $password, ?string $challengeId, ?string $code): array
    {
        if ($challengeId !== null && $challengeId !== '' && $code !== null && $code !== '') {
            $challenge = $this->challenges->find(hash('sha256', $challengeId));
            if ($challenge === null || $challenge->userId !== $user->getId() || $challenge->purpose !== VerificationChallenge::RECONFIRM) {
                return [self::EXPIRED, 0];
            }
            $result = $challenge->check(self::codeHash($challengeId, $code), $this->clock->now()->getTimestamp());
            if ($result === VerificationChallenge::INVALID) {
                $this->challenges->save($challenge);

                return [self::INVALID_CODE, $challenge->remainingAttempts()];
            }
            $this->challenges->remove($challenge);

            return [match ($result) {
                VerificationChallenge::OK => self::OK,
                VerificationChallenge::LOCKED => self::LOCKED,
                default => self::EXPIRED,
            }, 0];
        }
        if ($password !== null && $password !== '') {
            return [$user->isActive() && $this->hasher->isPasswordValid($user, $password) ? self::OK : self::INVALID_PASSWORD, 0];
        }

        return [self::MISSING, 0];
    }

    public static function codeHash(string $challengeId, string $code): string
    {
        return hash('sha256', $challengeId.':'.$code);
    }

    /** `jeanne.dupont@exemple.fr` → `j•••@exemple.fr` */
    public static function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 1).'•••@'.$domain;
    }
}
