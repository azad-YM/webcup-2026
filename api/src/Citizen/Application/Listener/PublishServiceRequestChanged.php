<?php

declare(strict_types=1);
namespace Citizen\Application\Listener;
use Citizen\Domain\Event\ServiceRequestChanged;
use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler]
final readonly class PublishServiceRequestChanged {
 public function __construct(private RealtimePublisher $publisher){}
 public function __invoke(ServiceRequestChanged $event):void {
  $payload=['id'=>$event->requestId,'status'=>$event->status];
  $this->publisher->publish('private.citizen.'.$event->citizenId.'.requests','request.changed',$payload);
  $this->publisher->publish('private.agents.requests','request.changed',$payload);
 }
}
