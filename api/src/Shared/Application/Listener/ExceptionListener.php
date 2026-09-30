<?php

namespace Shared\Application\Listener;

use Shared\Application\Exception\ApiException;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Messenger\Exception\HandlerFailedException;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class ExceptionListener {
  public function __invoke(ExceptionEvent $event) {
    $exception = $event->getThrowable();

    if ($exception instanceof HandlerFailedException && $exception->getPrevious() !== null) {
      $exception = $exception->getPrevious();
    }

    $response = new Response(status: Response::HTTP_INTERNAL_SERVER_ERROR);
    $output = [
      "path" => $event->getRequest()->getPathInfo(),
      "message" => $exception->getMessage()
    ];

    if ($exception instanceof ApiException) {
      $response->setStatusCode($exception->statusCode());
      $output['code'] = $exception->errorCode();
      $output['details'] = $exception->details();
    } else if ($exception instanceof HttpExceptionInterface) {
      $response->setStatusCode($exception->getStatusCode());
      $response->headers->replace($exception->getHeaders());

      if ($exception->getPrevious() instanceof ValidationFailedException) {
        $output['message'] = $exception->getPrevious()->getMessage();
      }
    } else if ($exception instanceof NotFoundException) {
      $response->setStatusCode(Response::HTTP_NOT_FOUND);
    } else if($exception instanceof AccessDeniedException) {
      $response->setStatusCode(Response::HTTP_FORBIDDEN);
    } else if($exception instanceof ConflitException) {
      $response->setStatusCode(Response::HTTP_CONFLICT);
    } else if($exception instanceof DomainException) {
      // A broken business rule is a client error, not a server crash.
      $response->setStatusCode(Response::HTTP_BAD_REQUEST);
    }

    $response->headers->set('Content-Type', 'application/json');
    $response->setContent(json_encode($output));
    $event->setResponse($response);
  }
}
