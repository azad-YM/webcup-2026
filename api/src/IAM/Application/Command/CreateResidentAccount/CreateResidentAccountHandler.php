<?php

declare(strict_types=1);

namespace IAM\Application\Command\CreateResidentAccount;

use IAM\Application\Exception\EmailAlreadyUsed;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Domain\Entity\User;
use Shared\Application\Ports\Service\IIdProvider;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * F71: creates a resident account in the current transaction. Called by the IAM adapter of the
 * Citizen port (no route of its own). Returns the provisional access code in clear text once:
 * only its hash is stored, and the resident must replace it at first login.
 */
final readonly class CreateResidentAccountHandler
{
    /** Without 0/O and 1/I to avoid misreading on a printed sheet. */
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function __construct(private IUserRepository $users, private UserPasswordHasherInterface $hasher, private IIdProvider $ids) {}

    /** @return array{userId: string, residentId: string, accessCode: string} */
    public function __invoke(CreateResidentAccountCommand $cmd): array
    {
        $name = trim($cmd->name);
        if ($name === '' || mb_strlen($name) > 200) {
            throw new \DomainException('A name is required.');
        }
        $email = $cmd->email !== null && trim($cmd->email) !== '' ? strtolower(trim($cmd->email)) : null;
        if ($email !== null) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255 || str_ends_with($email, '.invalid')) {
                throw new \DomainException('Invalid email.');
            }
            if ($this->users->findByEmail($email) !== null) {
                throw new EmailAlreadyUsed('An account already exists for this email.');
            }
        }
        $residentId = $this->uniqueResidentId();
        $accessCode = self::random(4).'-'.self::random(4);

        $user = User::createResident($this->ids->getId(), $residentId, $email, $name);
        // setPassword keeps the first-login obligation set by createResident.
        $user->setPassword($this->hasher->hashPassword($user, $accessCode));
        $this->users->save($user);

        return ['userId' => $user->getId(), 'residentId' => $residentId, 'accessCode' => $accessCode];
    }

    private function uniqueResidentId(): string
    {
        for ($attempt = 0; $attempt < 10; ++$attempt) {
            $candidate = 'NT-'.self::random(4).'-'.self::random(4);
            if ($this->users->findByResidentId($candidate) === null) {
                return $candidate;
            }
        }
        throw new \DomainException('Could not generate a unique resident identifier.');
    }

    private static function random(int $length): string
    {
        $value = '';
        for ($i = 0; $i < $length; ++$i) {
            $value .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return $value;
    }
}
