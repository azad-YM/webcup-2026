<?php

namespace Shared\Application\Lib;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;
use Symfony\Component\Messenger\Exception\HandlerFailedException;

class AppController extends AbstractController {
  public function __construct(
    private MessageBusInterface $commandBus,
    private MessageBusInterface $queryBus,
  ) {}

  public function dispatch($command) {
    try {
      $envelope = $this->commandBus->dispatch($command);
    } catch (HandlerFailedException $exception) {
      $cause = $exception->getPrevious();
      if ($cause instanceof \DomainException || $cause instanceof \InvalidArgumentException) {
        return $this->json(['error' => $cause->getMessage()], 422);
      }
      throw $exception;
    }
    $response = $envelope->last(HandledStamp::class)->getResult();

    return $this->json($response);
  }

  public function dispatchQuery($query) {
    $envelope = $this->queryBus->dispatch($query);
    $response = $envelope->last(HandledStamp::class)->getResult();

    return $this->json($response);
  }
}