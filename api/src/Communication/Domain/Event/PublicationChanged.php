<?php
namespace Communication\Domain\Event;
use Shared\Domain\Event\DomainEvent;
final readonly class PublicationChanged implements DomainEvent { public function __construct(public string $id) {} }
