<?php

declare(strict_types=1);

namespace IAM\Application\Command\IssuePortalCode;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class IssuePortalCodeCommand
{
    public function __construct(#[Assert\Choice(['admin'])] public string $destination, #[Assert\Regex('/^[A-Za-z0-9_-]{43}$/D')] public string $challenge) {}
}
