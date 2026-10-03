<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Shared\Domain\Exception\ConflitException;

/**
 * Créneau proposé par les agents pour un service municipal (F39) : un créneau accueille un seul rendez-vous.
 * Le nom du service, le lieu et les pièces à apporter sont recopiés à l'ouverture : le citoyen lit une
 * confirmation stable, même si le catalogue change ensuite.
 */
class AppointmentSlot
{
    public const DURATION_MIN = 5;
    public const DURATION_MAX = 240;
    public const LOCATION_MAX = 255;
    public const INSTRUCTIONS_MAX = 2000;

    private ?string $appointmentId = null;
    private int $version = 1;

    private function __construct(
        public readonly string $id,
        public readonly string $serviceId,
        public readonly string $serviceName,
        public readonly \DateTimeImmutable $startsAt,
        public readonly int $durationMinutes,
        public readonly string $location,
        public readonly string $instructions,
        public readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function open(
        string $id,
        string $serviceId,
        string $serviceName,
        \DateTimeImmutable $startsAt,
        int $durationMinutes,
        string $location,
        string $instructions,
        \DateTimeImmutable $now,
    ): self {
        $location = trim($location);
        $instructions = trim($instructions);
        if ($startsAt <= $now) {
            throw new \DomainException('A slot must start in the future.');
        }
        if ($durationMinutes < self::DURATION_MIN || $durationMinutes > self::DURATION_MAX) {
            throw new \DomainException('A slot lasts between 5 and 240 minutes.');
        }
        if ($location === '' || mb_strlen($location) > self::LOCATION_MAX || mb_strlen($instructions) > self::INSTRUCTIONS_MAX) {
            throw new \DomainException('A location (at most 255 characters) is required; instructions are limited to 2000 characters.');
        }

        return new self($id, $serviceId, mb_substr($serviceName, 0, 200), $startsAt, $durationMinutes, $location, $instructions, $now);
    }

    public function book(string $appointmentId, \DateTimeImmutable $now): void
    {
        if ($this->appointmentId !== null) {
            throw new ConflitException('This slot has just been booked. Choose another one.');
        }
        if ($this->startsAt <= $now) {
            throw new ConflitException('This slot has already started. Choose another one.');
        }
        $this->appointmentId = $appointmentId;
    }

    public function release(): void
    {
        $this->appointmentId = null;
    }

    public function appointmentId(): ?string { return $this->appointmentId; }

    public function isBooked(): bool { return $this->appointmentId !== null; }

    public function endsAt(): \DateTimeImmutable
    {
        return $this->startsAt->modify(sprintf('+%d minutes', $this->durationMinutes));
    }
}
