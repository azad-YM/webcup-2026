<?php

namespace Administration\Domain\VO;

use InvalidArgumentException;

class Permission
{
    private const ACTIONS = ['read', 'write', 'delete', 'approve', 'reject', 'execute'];

    public function __construct(
        public readonly string $context,
        public readonly string $resource,
        public readonly string $action,
    ) {
        if (!in_array($action, self::ACTIONS, true)) {
            throw new InvalidArgumentException('Invalid permission action');
        }
    }

    public static function fromArray(array $permission): self
    {
        return new self($permission['context'], $permission['resource'], $permission['action']);
    }

    public function key(): string
    {
        return sprintf('%s.%s.%s', $this->context, $this->resource, $this->action);
    }
}
