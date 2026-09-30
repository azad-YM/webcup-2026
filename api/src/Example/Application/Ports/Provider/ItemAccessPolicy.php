<?php

declare(strict_types=1);

namespace Example\Application\Ports\Provider;

use Shared\Domain\Exception\AccessDeniedException;

/**
 * Port owned by Example. The provider (IAM) implements it in its own
 * infrastructure; Example never reads IAM members, roles or permissions directly.
 */
interface ItemAccessPolicy
{
    /** @throws AccessDeniedException */
    public function assertCanRead(): void;

    /** @throws AccessDeniedException */
    public function assertCanWrite(): void;
}
