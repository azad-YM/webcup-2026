<?php

declare(strict_types=1);

namespace IAM\Application\Command\ChangeAccountStatus;

final readonly class ChangeAccountStatusCommand
{
    public function __construct(public string $userId, public string $status) {}
}
