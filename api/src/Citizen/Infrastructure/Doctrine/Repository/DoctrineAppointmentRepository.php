<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Service\AccountDataEraser;
use Citizen\Domain\Entity\Appointment;
use Citizen\Domain\Entity\AppointmentSlot;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineAppointmentRepository implements AppointmentRepository, AccountDataEraser
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function saveSlot(AppointmentSlot $slot): void
    {
        $this->manager->persist($slot);
    }

    public function removeSlot(AppointmentSlot $slot): void
    {
        $this->manager->remove($slot);
    }

    public function findSlot(string $id): ?AppointmentSlot
    {
        return $this->manager->find(AppointmentSlot::class, $id);
    }

    public function findOpenSlots(?string $serviceId, \DateTimeImmutable $from, int $limit): array
    {
        $query = $this->manager->createQueryBuilder()
            ->select('s')->from(AppointmentSlot::class, 's')
            ->where('s.appointmentId IS NULL')->andWhere('s.startsAt > :from')
            ->setParameter('from', $from)
            ->orderBy('s.startsAt', 'ASC')->addOrderBy('s.id', 'ASC')
            ->setMaxResults($limit);
        if ($serviceId !== null) {
            $query->andWhere('s.serviceId = :service')->setParameter('service', $serviceId);
        }

        return array_values($query->getQuery()->getResult());
    }

    public function findSlotsBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return array_values($this->manager->createQueryBuilder()
            ->select('s')->from(AppointmentSlot::class, 's')
            ->where('s.startsAt >= :from')->andWhere('s.startsAt < :to')
            ->setParameter('from', $from)->setParameter('to', $to)
            ->orderBy('s.startsAt', 'ASC')->addOrderBy('s.serviceName', 'ASC')
            ->getQuery()->getResult());
    }

    public function save(Appointment $appointment): void
    {
        $this->manager->persist($appointment);
        foreach ($appointment->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function find(string $id): ?Appointment
    {
        return $this->manager->find(Appointment::class, $id);
    }

    public function findByCitizen(string $citizenId): array
    {
        return array_values($this->manager->getRepository(Appointment::class)
            ->findBy(['citizenId' => $citizenId], ['startsAt' => 'ASC']));
    }

    public function findByIds(array $ids): array
    {
        if ($ids === []) {
            return [];
        }
        $indexed = [];
        foreach ($this->manager->getRepository(Appointment::class)->findBy(['id' => $ids]) as $appointment) {
            $indexed[$appointment->id] = $appointment;
        }

        return $indexed;
    }

    public function findConfirmedBetween(\DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return array_values($this->manager->createQueryBuilder()
            ->select('a')->from(Appointment::class, 'a')
            ->where('a.status = :status')->andWhere('a.startsAt > :from')->andWhere('a.startsAt <= :to')
            ->setParameter('status', Appointment::CONFIRMED)
            ->setParameter('from', $from)->setParameter('to', $to)
            ->getQuery()->getResult());
    }

    /** Suppression du compte : les créneaux réservés sont libérés, puis les rendez-vous effacés. */
    public function erase(string $citizenId): void
    {
        $ids = array_map(fn (Appointment $appointment) => $appointment->id, $this->findByCitizen($citizenId));
        if ($ids === []) {
            return;
        }
        $this->manager->createQueryBuilder()
            ->update(AppointmentSlot::class, 's')->set('s.appointmentId', 'NULL')
            ->where('s.appointmentId IN (:ids)')->setParameter('ids', $ids)
            ->getQuery()->execute();
        $this->manager->createQueryBuilder()
            ->delete(Appointment::class, 'a')->where('a.citizenId = :citizen')->setParameter('citizen', $citizenId)
            ->getQuery()->execute();
    }
}
