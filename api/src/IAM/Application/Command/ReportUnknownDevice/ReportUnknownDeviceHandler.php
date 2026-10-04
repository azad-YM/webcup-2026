<?php

declare(strict_types=1);

namespace IAM\Application\Command\ReportUnknownDevice;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Repository\KnownDeviceRepository;
use IAM\Application\Ports\Service\AccountSessionRevoker;
use IAM\Application\Ports\Service\SiteSessionTokens;
use IAM\Application\Service\CurrentAccount;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F54 : déconnecte toutes les sessions (incrément de `sessionVersion`, codes de portail supprimés), oublie
 * l'appareil signalé, retire la confiance de tous les appareils (F53), puis rend une nouvelle session à
 * l'appareil courant pour que le titulaire change aussitôt son mot de passe.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ReportUnknownDeviceHandler
{
    public function __construct(
        private CurrentAccount $account,
        private IUserRepository $users,
        private KnownDeviceRepository $devices,
        private AccountSessionRevoker $revoker,
        private SiteSessionTokens $sessions,
    ) {}

    /** @return array{token: string, signedOutEverywhere: bool} */
    public function __invoke(ReportUnknownDeviceCommand $cmd): array
    {
        $user = $this->account->user();
        $device = $this->devices->find($cmd->deviceId);
        if ($device === null || $device->userId !== $user->getId()) {
            throw new NotFoundException('Device not found.');
        }
        $current = $this->sessions->currentDeviceId();
        if ($current === $device->id) {
            throw new \DomainException('Vous utilisez cet appareil en ce moment : il ne peut pas être signalé depuis lui-même.');
        }
        $this->devices->remove($device);
        foreach ($this->devices->findByUser($user->getId()) as $other) {
            if ($other->id === $device->id) continue;
            $other->revokeTrust();
            $this->devices->save($other);
        }
        $user->revokeAllSessions();
        $this->revoker->revokePortalCodes($user->getId());
        $this->users->save($user);

        return ['token' => $this->sessions->issue($user, $current), 'signedOutEverywhere' => true];
    }
}
