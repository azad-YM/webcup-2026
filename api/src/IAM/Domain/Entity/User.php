<?php

namespace IAM\Domain\Entity;

use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class User implements UserInterface, PasswordAuthenticatedUserInterface
{

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
