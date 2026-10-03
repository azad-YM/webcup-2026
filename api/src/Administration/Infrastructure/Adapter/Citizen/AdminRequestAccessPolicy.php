<?php

declare(strict_types=1);
namespace Administration\Infrastructure\Adapter\Citizen;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
final readonly class AdminRequestAccessPolicy implements RequestAccessPolicy {
 public function __construct(private CheckCurrentMemberPermissionsHandler $permissions){}
 public function canRead():bool{return ($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.request.read']));}
 public function canWrite():bool{return ($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.request.write']));}
}
