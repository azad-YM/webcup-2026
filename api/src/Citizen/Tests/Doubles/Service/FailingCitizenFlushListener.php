<?php

declare(strict_types=1);

namespace Tests\Citizen\Doubles\Service;

use Citizen\Domain\Entity\Citizen;
use Doctrine\ORM\Event\OnFlushEventArgs;

final class FailingCitizenFlushListener
{
    public function onFlush(OnFlushEventArgs $event): void
    {
        foreach ($event->getObjectManager()->getUnitOfWork()->getScheduledEntityInsertions() as $entity) {
            if ($entity instanceof Citizen) {
                throw new \RuntimeException('Citizen flush failed');
            }
        }
    }
}
