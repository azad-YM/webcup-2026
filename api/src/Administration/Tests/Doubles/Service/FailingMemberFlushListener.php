<?php

declare(strict_types=1);

namespace Tests\Administration\Doubles\Service;

use Administration\Domain\Entity\Member;
use Doctrine\ORM\Event\OnFlushEventArgs;

final class FailingMemberFlushListener
{
    public function onFlush(OnFlushEventArgs $event): void
    {
        foreach ($event->getObjectManager()->getUnitOfWork()->getScheduledEntityInsertions() as $entity) {
            if ($entity instanceof Member) {
                throw new \RuntimeException('Member flush failed');
            }
        }
    }
}
