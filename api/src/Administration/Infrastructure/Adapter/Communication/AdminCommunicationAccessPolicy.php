<?php
namespace Administration\Infrastructure\Adapter\Communication;
use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
final readonly class AdminCommunicationAccessPolicy implements CommunicationAccessPolicy {
 public function __construct(private CheckCurrentMemberPermissionsHandler $permissions) {}
 public function canPublish(): bool { return ($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.communication.write'])); }
}
