<?php

declare(strict_types=1);

namespace Citizen\Domain\Entity;

use Citizen\Domain\Event\AppointmentChanged;
use Shared\Domain\Exception\ConflitException;
use Shared\Domain\Model\AggregateRoot;

/**
 * Rendez-vous d'un citoyen avec un agent (F39), sur un créneau dont il recopie les informations.
 * Rappels (F40) : la veille (24 h avant) et 2 h avant, chacun une seule fois.
 */
class Appointment
{
    use AggregateRoot;

    public const CONFIRMED = 'confirmed';
    public const CANCELLED = 'cancelled';

    public const REMINDER_DAY_BEFORE = 'day-before';
    public const REMINDER_TWO_HOURS = 'two-hours';

    private string $slotId;
    private string $serviceId;
    private string $serviceName;
    private \DateTimeImmutable $startsAt;
    private int $durationMinutes;
    private string $location;
    private string $instructions;
    private string $status = self::CONFIRMED;
    private \DateTimeImmutable $updatedAt;
    private ?\DateTimeImmutable $dayBeforeRemindedAt = null;
    private ?\DateTimeImmutable $twoHoursRemindedAt = null;
    private int $version = 1;

    private function __construct(
        public readonly string $id,
        public readonly string $reference,
        public readonly string $citizenId,
        AppointmentSlot $slot,
        public readonly \DateTimeImmutable $createdAt,
    ) {
        $this->copy($slot);
        $this->updatedAt = $createdAt;
    }

    /** Le créneau doit être réservé par l'appelant (`$slot->book()`) dans la même transaction. */
    public static function book(string $id, string $citizenId, AppointmentSlot $slot, \DateTimeImmutable $now): self
    {
        $reference = 'RDV-' . strtoupper(substr(str_replace('-', '', $id), -8)); // fin aléatoire de l'UUID v7 (le début est l'horodatage)
        $appointment = new self($id, $reference, $citizenId, $slot, $now);
        $appointment->record(new AppointmentChanged($id, $citizenId, self::CONFIRMED));

        return $appointment;
    }

    public function reschedule(AppointmentSlot $slot, \DateTimeImmutable $now): void
    {
        $this->assertChangeable($now);
        $this->copy($slot);
        $this->dayBeforeRemindedAt = null;
        $this->twoHoursRemindedAt = null;
        $this->updatedAt = $now;
        $this->record(new AppointmentChanged($this->id, $this->citizenId, self::CONFIRMED));
    }

    public function cancel(\DateTimeImmutable $now): void
    {
        $this->assertChangeable($now);
        $this->status = self::CANCELLED;
        $this->updatedAt = $now;
        $this->record(new AppointmentChanged($this->id, $this->citizenId, self::CANCELLED));
    }

    /** Rappel à envoyer maintenant, ou null. À moins de 2 h, seul le rappel « 2 h avant » part. */
    public function dueReminder(\DateTimeImmutable $now): ?string
    {
        if ($this->status !== self::CONFIRMED || $this->startsAt <= $now) {
            return null;
        }
        $seconds = $this->startsAt->getTimestamp() - $now->getTimestamp();
        if ($seconds <= 2 * 3600) {
            return $this->twoHoursRemindedAt === null ? self::REMINDER_TWO_HOURS : null;
        }
        if ($seconds <= 24 * 3600) {
            return $this->dayBeforeRemindedAt === null ? self::REMINDER_DAY_BEFORE : null;
        }

        return null;
    }

    public function markReminded(string $reminder, \DateTimeImmutable $now): void
    {
        $this->dayBeforeRemindedAt ??= $now;
        if ($reminder === self::REMINDER_TWO_HOURS) {
            $this->twoHoursRemindedAt ??= $now;
        }
    }

    public function slotId(): string { return $this->slotId; }
    public function serviceId(): string { return $this->serviceId; }
    public function serviceName(): string { return $this->serviceName; }
    public function startsAt(): \DateTimeImmutable { return $this->startsAt; }
    public function durationMinutes(): int { return $this->durationMinutes; }
    public function location(): string { return $this->location; }
    public function instructions(): string { return $this->instructions; }
    public function status(): string { return $this->status; }
    public function updatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function endsAt(): \DateTimeImmutable
    {
        return $this->startsAt->modify(sprintf('+%d minutes', $this->durationMinutes));
    }

    public function isChangeable(\DateTimeImmutable $now): bool
    {
        return $this->status === self::CONFIRMED && $this->startsAt > $now;
    }

    private function assertChangeable(\DateTimeImmutable $now): void
    {
        if (!$this->isChangeable($now)) {
            throw new ConflitException('This appointment can no longer be changed.');
        }
    }

    private function copy(AppointmentSlot $slot): void
    {
        $this->slotId = $slot->id;
        $this->serviceId = $slot->serviceId;
        $this->serviceName = $slot->serviceName;
        $this->startsAt = $slot->startsAt;
        $this->durationMinutes = $slot->durationMinutes;
        $this->location = $slot->location;
        $this->instructions = $slot->instructions;
    }
}
