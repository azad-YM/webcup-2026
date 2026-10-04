<?php

declare(strict_types=1);

namespace IAM\Application\Service;

use IAM\Application\Ports\Repository\KnownDeviceRepository;
use IAM\Application\Ports\Repository\SignInRecordRepository;
use IAM\Application\Ports\Repository\VerificationChallengeRepository;
use IAM\Application\Ports\Service\AccountMailer;
use IAM\Application\Ports\Service\ClientContext;
use IAM\Application\Ports\Service\SecretGenerator;
use IAM\Application\Ports\Service\SiteSessionTokens;
use IAM\Domain\DeviceLabel;
use IAM\Domain\Entity\KnownDevice;
use IAM\Domain\Entity\SignInRecord;
use IAM\Domain\Entity\User;
use IAM\Domain\Entity\VerificationChallenge;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;

/**
 * Fin commune des connexions du site (L15) : mot de passe (`/api/login_check`) et lien e-mail (D02).
 *
 * 1. `begin()` : première étape franchie. Si la vérification supplémentaire (F53) est active et que l'appareil
 *    n'est pas de confiance, un code est envoyé par e-mail et la réponse demande ce code ; sinon `complete()`.
 * 2. `complete()` : reconnaît l'appareil (F54, alerte si le compte en connaissait déjà un autre), trace la
 *    connexion et émet la session habituelle (JWT `site`, version de session, claim `did`).
 */
final readonly class SignInFlow
{
    public function __construct(
        private KnownDeviceRepository $devices,
        private SignInRecordRepository $signIns,
        private VerificationChallengeRepository $challenges,
        private SecretGenerator $secrets,
        private AccountMailer $mailer,
        private SiteSessionTokens $sessions,
        private ClientContext $client,
        private IClock $clock,
        private IIdProvider $ids,
    ) {}

    /** @return array<string, mixed> `{token}` ou `{verificationRequired, challengeId, emailHint, expiresIn}` */
    public function begin(User $user, string $method, ?string $deviceSecret): array
    {
        $deviceHash = self::deviceHash($deviceSecret);
        $email = $user->contactEmail();
        // F85 : après une activité suspecte, le code est exigé même sans vérification activée ni appareil de confiance.
        if ($email !== null && $user->codeRequiredAt($this->clock->now())) {
            return $this->challenge($user, $email, $method, $deviceHash);
        }
        if ($user->emailVerificationEnabled() && $email !== null) {
            $device = $deviceHash !== null ? $this->devices->findByHash($user->getId(), $deviceHash) : null;
            if ($device === null || !$device->isTrusted($this->clock->now())) {
                return $this->challenge($user, $email, $method, $deviceHash);
            }
        }

        return $this->complete($user, $method, $deviceHash, false, false);
    }

    /** @return array{token: string} */
    public function complete(User $user, string $method, ?string $deviceHash, bool $secondFactor, bool $trustDevice): array
    {
        $now = $this->clock->now();
        $label = DeviceLabel::fromUserAgent($this->client->userAgent());
        // Sans identifiant d'appareil, la connexion compte comme un appareil inconnu (jamais une dispense d'alerte).
        $deviceHash ??= hash('sha256', $this->secrets->token());
        $device = $this->devices->findByHash($user->getId(), $deviceHash);
        if ($device === null) {
            $device = KnownDevice::register($this->ids->getId(), $user->getId(), $deviceHash, $label, $now, $this->devices->countByUser($user->getId()) > 0);
        } else {
            $device->use($label, $now);
        }
        if ($secondFactor && $trustDevice) {
            $device->trust($now);
        }
        $this->devices->save($device);
        $this->signIns->add(new SignInRecord($this->ids->getId(), $user->getId(), $device->id, $label, $method, $secondFactor, mb_substr($this->client->ip(), 0, 45), $now));

        return ['token' => $this->sessions->issue($user, $device->id)];
    }

    /** @return array<string, mixed> */
    private function challenge(User $user, string $email, string $method, ?string $deviceHash): array
    {
        $previous = $this->challenges->findForUser($user->getId(), VerificationChallenge::SIGN_IN);
        if ($previous !== null) {
            $this->challenges->remove($previous);
        }
        $now = $this->clock->now()->getTimestamp();
        $challengeId = $this->secrets->token();
        $code = $this->secrets->code();
        $this->challenges->save(new VerificationChallenge(
            hash('sha256', $challengeId),
            $user->getId(),
            VerificationChallenge::SIGN_IN,
            IdentityReconfirmation::codeHash($challengeId, $code),
            $now,
            $now + VerificationChallenge::LIFETIME,
            $method,
            $deviceHash,
        ));
        $this->mailer->sendVerificationCode($email, $code, VerificationChallenge::SIGN_IN, (int) (VerificationChallenge::LIFETIME / 60));

        return [
            'verificationRequired' => true,
            'challengeId' => $challengeId,
            'emailHint' => IdentityReconfirmation::maskEmail($email),
            'expiresIn' => VerificationChallenge::LIFETIME,
        ];
    }

    /** Empreinte de l'identifiant d'appareil envoyé par le navigateur ; null s'il est absent ou mal formé. */
    public static function deviceHash(?string $deviceSecret): ?string
    {
        return $deviceSecret !== null && preg_match('/^[A-Za-z0-9_-]{16,128}$/D', $deviceSecret) === 1 ? hash('sha256', $deviceSecret) : null;
    }
}
