<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\Appointment;
use Citizen\Domain\Entity\AppointmentSlot;

/** Créneaux et rendez-vous (F39, F40), persistés sans flush (transaction du command.bus). */
interface AppointmentRepository
{
    public function saveSlot(AppointmentSlot $slot): void;

    public function removeSlot(AppointmentSlot $slot): void;

    public function findSlot(string $id): ?AppointmentSlot;

    /** @return list<AppointmentSlot> créneaux libres à venir, les plus proches d'abord ; tous services si null */
    public function findOpenSlots(?string $serviceId, \DateTimeImmutable $from, int $limit): array;

    /** @return list<AppointmentSlot> tous les créneaux de l'intervalle, dans l'ordre */
    public function findSlotsBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): array;

    /** Publie les événements de l'agrégat. */
    public function save(Appointment $appointment): void;

    public function find(string $id): ?Appointment;

    /** @return list<Appointment> les plus proches d'abord */
    public function findByCitizen(string $citizenId): array;

    /** @param list<string> $ids @return array<string, Appointment> indexés par identifiant */
    public function findByIds(array $ids): array;

    /** @return list<Appointment> rendez-vous confirmés commençant dans l'intervalle */
    public function findConfirmedBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): array;
}
