<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/**
 * Données du compte de connexion pour l'export F55 (contrat du port, dates ISO 8601).
 *
 * @phpstan-type Account array{email: ?string, name: ?string, status: string, emailVerificationEnabled: bool}
 * @phpstan-type Device array{label: string, firstSeenAt: string, lastUsedAt: string, trustedUntil: ?string}
 * @phpstan-type SignIn array{at: string, method: string, deviceLabel: string, secondFactor: bool, ip: string}
 */
final readonly class PersonalAccountData
{
    /**
     * @param array<string, mixed>       $account
     * @param list<array<string, mixed>> $devices
     * @param list<array<string, mixed>> $signIns
     */
    public function __construct(
        public array $account,
        public array $devices,
        public array $signIns,
    ) {}
}
