<?php

declare(strict_types=1);

namespace Tests\Administration\Doubles\Provider;

use Administration\Application\Exception\AccountAlreadyExists;
use Administration\Application\Ports\Provider\MemberAccountProvisioner;

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
