<?php

declare(strict_types=1);

namespace Participation\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Domain\Entity\Consultation;

/** No flush here: `command.bus` owns the transaction. */
final readonly class DoctrineConsultationRepository implements ConsultationRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function save(Consultation $consultation): void
    {
        $this->manager->persist($consultation);
    }

    public function find(string $id): ?Consultation
    {
        return $this->manager->find(Consultation::class, $id);
    }

    public function all(): array
    {
        return array_values($this->manager->getRepository(Consultation::class)->findAll());
    }
}
