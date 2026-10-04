<?php

namespace IAM\Domain\Entity;

use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class User implements UserInterface, PasswordAuthenticatedUserInterface
{

    private string $status = 'active';
    private int $sessionVersion = 0;

    public function status(): string { return $this->status; }
    public function sessionVersion(): int { return $this->sessionVersion; }
    public function isActive(): bool { return $this->status === 'active'; }

    public function setSuspended(bool $suspended): void
    {
        if ($this->status === 'deleted') throw new \DomainException('A deleted account cannot be restored.');
        $status = $suspended ? 'suspended' : 'active';
        if ($this->status !== $status) { $this->status = $status; ++$this->sessionVersion; }
    }

    public function deleteAccount(): void
    {
        if ($this->status === 'deleted') return;
        $this->status = 'deleted';
        ++$this->sessionVersion;
        $this->email = $this->id.'@deleted.invalid';
        $this->residentId = null;
        $this->name = null;
        $this->password = '!deleted';
    }

    public function __construct(
        private string $id, 
        private string $email, 
        private string $password, 
        private ?string $name = ''
    ){}

    public static function create(
        string $id,
        string $email,
        string $password,
        ?string $name = '',
    ): self {
        $user = new self($id, $email, $password, $name);
        return $user;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id)
    {
        $this->id = $id;
    }

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getName()
    {
        return $this->name;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function update(string $email, string $name): void
    {
        $this->email = $email;
        $this->name = $name;
    }

    public function getPassword(): string|null
    {
        return $this->password;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function eraseCredentials(): void
    {
        // nothing to do here
    }

    // --- F71 : compte d’habitant créé à l’accueil de la mairie, avec ou sans e-mail ---

    private ?string $residentId = null;
    private bool $passwordChangeRequired = false;

    /** Domaine technique des comptes sans e-mail : l’identifiant de connexion reste unique, jamais affiché. */
    public const NO_EMAIL_DOMAIN = 'habitant.nova-terra.invalid';

    /** The initial access code is set with `setPassword` (hashed) and must be replaced at first login. */
    public static function createResident(string $id, string $residentId, ?string $email, string $name): self
    {
        $user = new self($id, $email ?? strtolower($residentId).'@'.self::NO_EMAIL_DOMAIN, '', $name);
        $user->residentId = $residentId;
        $user->passwordChangeRequired = true;

        return $user;
    }

    public function residentId(): ?string { return $this->residentId; }
    public function passwordChangeRequired(): bool { return $this->passwordChangeRequired; }
    /** False for a resident account created without e-mail (technical address) or an anonymised account. */
    public function hasRealEmail(): bool { return !str_ends_with($this->email, '.invalid'); }

    /** Replaces the secret (already hashed) and lifts the first-login obligation. */
    public function changePassword(string $hashedPassword): void
    {
        $this->password = $hashedPassword;
        $this->passwordChangeRequired = false;
    }
}
