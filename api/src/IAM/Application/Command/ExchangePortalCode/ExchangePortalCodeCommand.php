<?php

declare(strict_types=1);

namespace IAM\Application\Command\ExchangePortalCode;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class ExchangePortalCodeCommand
{
    public function __construct(#[Assert\Regex('/^[a-f0-9]{64}$/D')] public string $code, #[Assert\Choice(['admin'])] public string $destination, #[Assert\Regex('/^[A-Za-z0-9_-]{43,128}$/D')] public string $verifier) {}
}
