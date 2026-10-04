<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Provider;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Ports\Provider\CitizenAccountProvisioner;

final class StubCitizenAccountProvisioner implements CitizenAccountProvisioner
{
    public ?string $receivedEmail = null;
    public ?string $receivedPassword = null;
    public bool $emailAlreadyUsed = false;

    public function __construct(private readonly string $accountId = 'account-id') {}

    public function create(string $email, #[\SensitiveParameter] string $password): string
    {
        if ($this->emailAlreadyUsed) { throw new AccountAlreadyExists(); }
        $this->receivedEmail = $email;
        $this->receivedPassword = $password;
        return $this->accountId;
    }
}
