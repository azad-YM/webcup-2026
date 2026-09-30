<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Service;

use IAM\Application\Exception\AccountAlreadyExists;
use IAM\Application\Exception\AccountCreationRejected;
use IAM\Application\Ports\Provider\MemberAccountProvisioner;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use IAM\Application\Command\CreateAccount\CreateAccountCommand;
use IAM\Application\Command\CreateAccount\CreateAccountHandler;
use IAM\Application\Exception\EmailAlreadyUsed;

final readonly class IAMMemberAccountProvisioner implements MemberAccountProvisioner
{
    public function __construct(private CreateAccountHandler $createAccount) {}

    public function create(string $email, string $name, #[\SensitiveParameter] string $password): string
    {
        try {
            return ($this->createAccount)(new CreateAccountCommand($email, $name, $password));
        } catch (EmailAlreadyUsed|UniqueConstraintViolationException) {
            throw new AccountAlreadyExists();
        } catch (\DomainException) {
            throw new AccountCreationRejected();
        }
    }
}
