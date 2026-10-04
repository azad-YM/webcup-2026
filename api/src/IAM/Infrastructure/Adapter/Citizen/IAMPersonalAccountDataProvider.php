<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Citizen;

use Citizen\Application\Ports\Provider\AccountReconfirmation;
use Citizen\Application\Ports\Provider\PersonalAccountData;
use Citizen\Application\Ports\Provider\PersonalAccountDataProvider;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\KnownDeviceRepository;
use IAM\Application\Ports\Repository\SignInRecordRepository;
use IAM\Application\Service\IdentityReconfirmation;
use IAM\Domain\Entity\KnownDevice;
use IAM\Domain\Entity\SignInRecord;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;

/**
 * Port de Citizen implémenté par IAM (F55) : confirmation d'identité (service `IdentityReconfirmation` d'IAM)
 * et données du compte de connexion traduites vers le contrat de Citizen. Ni mot de passe ni empreinte.
 */
final readonly class IAMPersonalAccountDataProvider implements PersonalAccountDataProvider
{
    public const SIGN_INS = 50;

    public function __construct(
        private IUserRepository $users,
        private IdentityReconfirmation $reconfirmation,
        private KnownDeviceRepository $devices,
        private SignInRecordRepository $signIns,
        private IClock $clock,
    ) {}

    public function reconfirm(string $userId, ?string $password, ?string $challengeId, ?string $code): AccountReconfirmation
    {
        $user = $this->users->findById($userId) ?? throw new NotFoundException('Account not found.');
        [$result, $left] = $this->reconfirmation->verify($user, $password, $challengeId, $code);

        return new AccountReconfirmation(match ($result) {
            IdentityReconfirmation::OK => AccountReconfirmation::CONFIRMED,
            IdentityReconfirmation::INVALID_PASSWORD => AccountReconfirmation::INVALID_PASSWORD,
            IdentityReconfirmation::INVALID_CODE => AccountReconfirmation::INVALID_CODE,
            IdentityReconfirmation::LOCKED => AccountReconfirmation::TOO_MANY_ATTEMPTS,
            IdentityReconfirmation::EXPIRED => AccountReconfirmation::CODE_EXPIRED,
            default => AccountReconfirmation::MISSING,
        }, $left);
    }

    public function accountData(string $userId): PersonalAccountData
    {
        $user = $this->users->findById($userId) ?? throw new NotFoundException('Account not found.');
        $now = $this->clock->now();

        return new PersonalAccountData(
            [
                'email' => $user->contactEmail(),
                'name' => $user->getName() ?: null,
                'status' => $user->status(),
                'emailVerificationEnabled' => $user->emailVerificationEnabled(),
            ],
            array_map(static fn (KnownDevice $device) => [
                'label' => $device->label(),
                'firstSeenAt' => $device->firstSeenAt->format(DATE_ATOM),
                'lastUsedAt' => $device->lastUsedAt()->format(DATE_ATOM),
                'trustedUntil' => $device->isTrusted($now) ? $device->trustedUntil()?->format(DATE_ATOM) : null,
            ], $this->devices->findByUser($userId)),
            array_map(static fn (SignInRecord $record) => [
                'at' => $record->occurredAt->format(DATE_ATOM),
                'method' => $record->method,
                'deviceLabel' => $record->deviceLabel,
                'secondFactor' => $record->secondFactor,
                'ip' => $record->ip,
            ], $this->signIns->recentByUser($userId, self::SIGN_INS)),
        );
    }
}
