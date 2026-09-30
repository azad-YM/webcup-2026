<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Example;

use IAM\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use IAM\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Example\Application\Ports\Provider\ItemAccessPolicy;
use Shared\Domain\Exception\AccessDeniedException;

/** Provider-side adapter: implements the Example port with IAM use cases. */
final readonly class AdminItemAccessPolicy implements ItemAccessPolicy
{
    public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}

    public function assertCanRead(): void
    {
        $this->assertAllowed('admin.item.read');
    }

    public function assertCanWrite(): void
    {
        $this->assertAllowed('admin.item.write');
    }

    private function assertAllowed(string $permission): void
    {
        if (!(($this->permissions)(new CheckCurrentMemberPermissionsQuery([$permission])))) {
            throw new AccessDeniedException('Item permission required: ' . $permission);
        }
    }
}
