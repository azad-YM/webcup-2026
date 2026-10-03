<?php
namespace Communication\Application\Ports\Provider;
use Communication\Application\DTO\Audience;
interface AudienceProvider { public function current(): Audience; }
