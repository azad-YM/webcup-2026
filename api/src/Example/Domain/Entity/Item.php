<?php

declare(strict_types=1);

namespace Example\Domain\Entity;

use Example\Domain\Enum\ItemStatus;
use Example\Domain\Event\ItemCreated;
use Shared\Domain\Model\AggregateRoot;

/** Fictional aggregate showing the expected shape of a business entity. */
class Item
{
    use AggregateRoot;

    public const NAME_MAX_LENGTH = 120;
    public const DESCRIPTION_MAX_LENGTH = 1000;

    private function __construct(
        private readonly string $id,
        private string $name,
        private string $description,
        private ItemStatus $status,
        private readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function create(string $id, string $name, string $description, \DateTimeImmutable $createdAt): self
    {
        [$name, $description] = self::validate($name, $description);
        $item = new self($id, $name, $description, ItemStatus::ACTIVE, $createdAt);
        $item->record(new ItemCreated($item->id, $item->name));

        return $item;
    }

    /** Rebuilds an existing item without recording a creation event. */
    public static function reconstitute(string $id, string $name, string $description, ItemStatus $status, \DateTimeImmutable $createdAt): self
    {
        return new self($id, $name, $description, $status, $createdAt);
    }

    public function update(string $name, string $description, ItemStatus $status): void
    {
        [$name, $description] = self::validate($name, $description);
        $this->name = $name;
        $this->description = $description;
        $this->status = $status;
    }

    /** @return array{string, string} */
    private static function validate(string $name, string $description): array
    {
        $name = trim($name);
        $description = trim($description);
        if ($name === '' || mb_strlen($name) > self::NAME_MAX_LENGTH) {
            throw new \DomainException(sprintf('Item name must contain between 1 and %d characters.', self::NAME_MAX_LENGTH));
        }
        if (mb_strlen($description) > self::DESCRIPTION_MAX_LENGTH) {
            throw new \DomainException(sprintf('Item description must not exceed %d characters.', self::DESCRIPTION_MAX_LENGTH));
        }

        return [$name, $description];
    }

    public function id(): string
    {
        return $this->id;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function description(): string
    {
        return $this->description;
    }

    public function status(): ItemStatus
    {
        return $this->status;
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
