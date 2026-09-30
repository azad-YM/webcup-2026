<?php

namespace Shared\Domain\Model;

use Shared\Domain\Event\DomainEvent;

trait AggregateRoot {
  /** @var DomainEvent[] */
  private array $recordedEvents = [];

  protected function record(DomainEvent $event): void
  {
    $this->recordedEvents[] = $event;
  }

  /**
   * Libère les events (pour le bus d’event) et réinitialise la pile.
   *
   * @return DomainEvent[]
   */
  public function pullDomainEvents(): array
  {
    $events = $this->recordedEvents;
    $this->recordedEvents = [];

    return $events;
  }
}
