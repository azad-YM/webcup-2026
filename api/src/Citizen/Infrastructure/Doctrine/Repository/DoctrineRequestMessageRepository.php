<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Doctrine\Repository;

use Citizen\Application\Ports\Repository\RequestMessageRepository;
use Citizen\Domain\Entity\RequestMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineRequestMessageRepository implements RequestMessageRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(RequestMessage $message): void
    {
        $this->manager->persist($message);
        foreach ($message->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }

    public function findByRequest(string $requestId): array
    {
        return array_values($this->manager->getRepository(RequestMessage::class)
            ->findBy(['requestId' => $requestId], ['createdAt' => 'ASC', 'id' => 'ASC']));
    }

    public function countByRequests(array $requestIds): array
    {
        if ($requestIds === []) {
            return [];
        }
        $rows = $this->manager->createQueryBuilder()
            ->select('m.requestId AS requestId, COUNT(m.id) AS total')->from(RequestMessage::class, 'm')
            ->where('m.requestId IN (:ids)')->setParameter('ids', array_values($requestIds))
            ->groupBy('m.requestId')->getQuery()->getArrayResult();
        $counts = [];
        foreach ($rows as $row) {
            $counts[(string) $row['requestId']] = (int) $row['total'];
        }

        return $counts;
    }
}
