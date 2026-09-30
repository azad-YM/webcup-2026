<?php

namespace Shared\Domain\VO;

class AuthenticatedUser
{
    public function __construct(
        private readonly string $userId,
        private readonly ?string $email = null,
    ) {}

    public static function create(string $userId, string $email)
    {
        return new self($userId, $email);
    }

    public function getId()
    {
        return $this->userId;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public static function fromArray(array $data)
    {
        return new self($data['userId'], $data['email'] ?? null);
    }

    public function toJsonSerialize()
    {
        return [
            'userId' => $this->userId,
            'email' => $this->email,
        ];
    }
}
