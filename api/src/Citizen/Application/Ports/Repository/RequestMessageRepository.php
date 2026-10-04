<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Repository;

use Citizen\Domain\Entity\RequestMessage;

/** F84 : fil de messages d'une demande. */
interface RequestMessageRepository
{
    /** Persiste sans flush (transaction du command.bus) et publie les événements. */
    public function save(RequestMessage $message): void;

    /** @return list<RequestMessage> les plus anciens d'abord */
    public function findByRequest(string $requestId): array;

    /**
     * @param list<string> $requestIds
     * @return array<string, int> requestId => nombre de messages
     */
    public function countByRequests(array $requestIds): array;
}
