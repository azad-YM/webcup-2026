<?php

declare(strict_types=1);

namespace Audit\Application\DTO\Security;

/** F85 : un compte et un compteur (nouveaux appareils, connexions…), libellé masqué fourni par IAM. */
final readonly class AccountSignal
{
    public function __construct(
        public string $accountId,
        public string $label,
        public int $count,
    ) {}
}
