<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

use IAM\Domain\Entity\User;

/** Émission de la session du site (JWT d'audience `site`, comme `POST /api/login_check`). */
interface SiteSessionTokens
{
    /** `$deviceId` : appareil reconnu de la connexion (claim `did`), pour reconnaître « cet appareil ». */
    public function issue(User $user, ?string $deviceId): string;

    /** Appareil de la session courante (claim `did`), null pour une session antérieure à L15. */
    public function currentDeviceId(): ?string;
}
