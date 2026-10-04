<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Citizen;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Exception\AccountCreationRejected;
use Citizen\Application\Ports\Provider\ResidentAccountCredentials;
use Citizen\Application\Ports\Provider\ResidentAccountProvisioner;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use IAM\Application\Command\CreateResidentAccount\CreateResidentAccountCommand;
use IAM\Application\Command\CreateResidentAccount\CreateResidentAccountHandler;
use IAM\Application\Exception\EmailAlreadyUsed;

/** Port of Citizen implemented by IAM (F71): resident account created at the city reception. */
final readonly class IAMResidentAccountProvisioner implements ResidentAccountProvisioner
{
    public function __construct(private CreateResidentAccountHandler $createResidentAccount) {}

    public function createResidentAccount(string $name, ?string $email): ResidentAccountCredentials
    {
        try {
            $account = ($this->createResidentAccount)(new CreateResidentAccountCommand($name, $email));
        } catch (EmailAlreadyUsed|UniqueConstraintViolationException) {
            throw new AccountAlreadyExists();
        } catch (\DomainException) {
            throw new AccountCreationRejected();
        }

        return new ResidentAccountCredentials($account['userId'], $account['residentId'], $account['accessCode']);
    }
}
