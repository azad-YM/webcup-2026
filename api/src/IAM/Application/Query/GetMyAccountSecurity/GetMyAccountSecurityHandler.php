<?php

declare(strict_types=1);

namespace IAM\Application\Query\GetMyAccountSecurity;

use IAM\Application\Ports\Repository\KnownDeviceRepository;
use IAM\Application\Ports\Repository\SignInRecordRepository;
use IAM\Application\Ports\Service\SiteSessionTokens;
use IAM\Application\Service\CurrentAccount;
use IAM\Application\Service\IdentityReconfirmation;
use IAM\Domain\Entity\KnownDevice;
use IAM\Domain\Entity\SignInRecord;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** « Sécurité du compte » (F53, F54) : vérification supplémentaire, appareils reconnus, connexions récentes. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyAccountSecurityHandler
{
    public const RECENT_SIGN_INS = 10;

    public function __construct(
        private CurrentAccount $account,
        private KnownDeviceRepository $devices,
        private SignInRecordRepository $signIns,
        private SiteSessionTokens $sessions,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(GetMyAccountSecurityQuery $query): array
    {
        $user = $this->account->user();
        $email = $user->contactEmail();
        $current = $this->sessions->currentDeviceId();
        $now = $this->clock->now();

        return [
            'emailHint' => $email !== null ? IdentityReconfirmation::maskEmail($email) : null,
            'emailAvailable' => $email !== null,
            'emailVerificationEnabled' => $user->emailVerificationEnabled(),
            'devices' => array_map(static fn (KnownDevice $device) => [
                'id' => $device->id,
                'label' => $device->label(),
                'firstSeenAt' => $device->firstSeenAt->format(DATE_ATOM),
                'lastUsedAt' => $device->lastUsedAt()->format(DATE_ATOM),
                'trusted' => $device->isTrusted($now),
                'trustedUntil' => $device->isTrusted($now) ? $device->trustedUntil()?->format(DATE_ATOM) : null,
                'current' => $device->id === $current,
            ], $this->devices->findByUser($user->getId())),
            'recentSignIns' => array_map(static fn (SignInRecord $record) => [
                'at' => $record->occurredAt->format(DATE_ATOM),
                'method' => $record->method,
                'deviceLabel' => $record->deviceLabel,
                'secondFactor' => $record->secondFactor,
                'ip' => $record->ip,
            ], $this->signIns->recentByUser($user->getId(), self::RECENT_SIGN_INS)),
        ];
    }
}
