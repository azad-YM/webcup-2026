<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

interface AccountSessionRevoker { public function revokePortalCodes(string $userId): void; }
