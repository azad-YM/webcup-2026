<?php

namespace Shared\Application\Exception;

abstract class ApiException extends \RuntimeException
{
  /**
   * @param array<string, mixed> $details
   */
  public function __construct(
    string $message,
    private readonly int $statusCode,
    private readonly string $errorCode,
    private readonly array $details = [],
  ) {
    parent::__construct($message);
  }

  public function statusCode(): int
  {
    return $this->statusCode;
  }

  public function errorCode(): string
  {
    return $this->errorCode;
  }

  /** @return array<string, mixed> */
  public function details(): array
  {
    return $this->details;
  }
}
