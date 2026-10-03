<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Citizen;

use Citizen\Application\Exception\AccountAlreadyExists;
use Citizen\Application\Exception\AccountCreationRejected;
use Citizen\Application\Ports\Provider\CitizenAccountProvisioner;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use IAM\Application\Command\CreateAccount\CreateAccountCommand;
use IAM\Application\Command\CreateAccount\CreateAccountHandler;
use IAM\Application\Exception\EmailAlreadyUsed;

/**
 * Port de Citizen implémenté par IAM : crée le compte de connexion d'un nouveau citoyen
 * dans la transaction courante. CreateAccount exige un nom : la partie locale de l'e-mail est utilisée.
 */
final readonly class IAMCitizenAccountProvisioner implements CitizenAccountProvisioner
{
    public function __construct(private CreateAccountHandler $createAccount) {}

    public function create(string $email, #[\SensitiveParameter] string $password): string
    {
        try {
            return ($this->createAccount)(new CreateAccountCommand($email, self::accountName($email), $password));
        } catch (EmailAlreadyUsed|UniqueConstraintViolationException) {
            throw new AccountAlreadyExists();
        } catch (\DomainException) {
            throw new AccountCreationRejected();
        }
    }

    private static function accountName(string $email): string
    {
        $email = trim($email);
        $localPart = trim(explode('@', $email, 2)[0]);

        return $localPart !== '' ? $localPart : $email;
    }
}
