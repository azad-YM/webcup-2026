<?php
namespace Communication\Application\EventHandler;
use Communication\Domain\Event\PublicationChanged;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'event.bus')]
final readonly class PublishRealtimeChange {
 public function __construct(private RealtimePublisher $publisher) {}
 public function __invoke(PublicationChanged $event): void { $this->publisher->publish('public.alerts','changed',['id'=>$event->id]); }
}
