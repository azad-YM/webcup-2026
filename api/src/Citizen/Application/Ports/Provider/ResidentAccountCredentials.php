<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/** Contract of `ResidentAccountProvisioner`: the access code is shown once, never stored by Citizen. */
final readonly class ResidentAccountCredentials
{
    public function __construct(
        public string $userId,
        public string $residentId,
        #[\SensitiveParameter] public string $accessCode,
    ) {}

    public function __debugInfo(): array
    {
        return ['userId' => $this->userId, 'residentId' => $this->residentId, 'accessCode' => '[redacted]'];
    }
}
