<?php

declare(strict_types=1);

namespace Tests\IAM\Doubles\Provider;

use IAM\Application\Exception\AccountAlreadyExists;
use IAM\Application\Ports\Provider\MemberAccountProvisioner;

final class StubMemberAccountProvisioner implements MemberAccountProvisioner
{
    public ?string $receivedPassword = null;
    public bool $fail = false;
    public function create(string $email, string $name, #[\SensitiveParameter] string $password): string
    {
        if ($this->fail) { throw new AccountAlreadyExists(); }
        $this->receivedPassword = $password;
        return 'account-id';
    }
}
