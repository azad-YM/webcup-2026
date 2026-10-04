<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Security;

use IAM\Application\Ports\Service\SecretGenerator;

final class RandomSecretGenerator implements SecretGenerator
{
    public function token(): string { return bin2hex(random_bytes(32)); }

    public function code(): string { return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT); }
}
