<?php

declare(strict_types=1);
namespace Citizen\Application\Ports\Provider;
interface RequestAccessPolicy {public function canRead():bool;public function canWrite():bool;}
