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
}
