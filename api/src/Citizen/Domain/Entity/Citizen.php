<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\CitizenRegistered;
use Shared\Domain\Model\AggregateRoot;

/**
 * Habitant inscrit sur la plateforme. Le compte de connexion appartient à IAM
 * et n'est référencé que par son identifiant ; le profil personnel est facultatif.
 */
class Citizen
{
    use AggregateRoot;

    private string $status = 'active';

    public function status(): string { return $this->status; }
    public function setSuspended(bool $suspended): void
    {
        if ($this->status === 'deleted') throw new \DomainException('A deleted citizen cannot be restored.');
        $this->status = $suspended ? 'suspended' : 'active';
    }
    public function deleteAccount(): void
    {
        $this->status = 'deleted';
        $this->updateProfile(null, null, null, null, null, null);
    }

    private ?string $firstName = null;
    private ?string $lastName = null;
    private ?string $phone = null;
    private ?string $address = null;
    private ?string $district = null;
    private ?string $preferredLanguage = null;

    public function __construct(
        public readonly string $id,
        public readonly string $userId,
        public readonly \DateTimeImmutable $registeredAt,
    ) {}

    public static function register(string $id, string $userId, \DateTimeImmutable $registeredAt): self
    {
        $citizen = new self($id, $userId, $registeredAt);
        $citizen->record(new CitizenRegistered($citizen->id, $citizen->userId, $citizen->registeredAt));

        return $citizen;
    }

    /** Remplace l'ensemble du profil personnel ; une valeur vide est enregistrée comme absente. */
    public function updateProfile(
        ?string $firstName,
        ?string $lastName,
        ?string $phone,
        ?string $address,
        ?string $district,
        ?string $preferredLanguage,
    ): void {
        $this->firstName = self::normalize($firstName);
        $this->lastName = self::normalize($lastName);
        $this->phone = self::normalize($phone);
        $this->address = self::normalize($address);
        $this->district = self::normalize($district);
        $this->preferredLanguage = self::normalize($preferredLanguage);
    }

    /** Indicateur de guidage uniquement, jamais une condition d'accès. */
    public function isProfileCompleted(): bool
    {
        return $this->firstName !== null && $this->lastName !== null && $this->district !== null;
    }

    public function firstName(): ?string { return $this->firstName; }
    public function lastName(): ?string { return $this->lastName; }
    public function phone(): ?string { return $this->phone; }
    public function address(): ?string { return $this->address; }
    public function district(): ?string { return $this->district; }
    public function preferredLanguage(): ?string { return $this->preferredLanguage; }

    private static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
