<?php

declare(strict_types=1);
namespace Citizen\Domain\Event;
use Shared\Domain\Event\DomainEvent;
final readonly class ServiceRequestChanged implements DomainEvent {
 public function __construct(public string $requestId, public string $citizenId, public string $status) {}
}
