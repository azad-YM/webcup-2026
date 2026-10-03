<?php
declare(strict_types=1);
namespace Tests\Citizen\Doubles\Provider;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
final class StubRequestAccessPolicy implements RequestAccessPolicy {
 public function __construct(public bool $read=false,public bool $write=false){}
 public function canRead():bool{return $this->read;}public function canWrite():bool{return $this->write;}
}
