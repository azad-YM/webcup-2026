<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\LoginSecurityEventRepository;
use IAM\Domain\Entity\LoginSecurityEvent;

final readonly class DoctrineLoginSecurityEventRepository implements LoginSecurityEventRepository
{
    /** Journal entries older than this are purged when a new one is written. */
    private const RETENTION_DAYS = 90;

    public function __construct(private EntityManagerInterface $manager) {}

    public function record(LoginSecurityEvent $event): void
    {
        $db = $this->manager->getConnection();
        $db->insert('iam_login_security_events', [
            'id' => $event->id,
            'occurred_at' => $event->occurredAt->format('Y-m-d H:i:s'),
            'scope' => $event->scope,
            'email' => $event->email,
            'ip' => $event->ip,
            'failures' => $event->failures,
            'locked_seconds' => $event->lockedSeconds,
        ]);
        $db->executeStatement(
            'DELETE FROM iam_login_security_events WHERE occurred_at < ? LIMIT 100',
            [$event->occurredAt->modify('-'.self::RETENTION_DAYS.' days')->format('Y-m-d H:i:s')],
        );
    }

    public function latest(int $limit, ?string $search = null): array
    {
        $qb = $this->manager->createQueryBuilder()
            ->select('e')->from(LoginSecurityEvent::class, 'e')
            ->orderBy('e.occurredAt', 'DESC')
            ->setMaxResults($limit);
        if ($search !== null) {
            $qb->where('e.email LIKE :search OR e.ip LIKE :search')
                ->setParameter('search', '%'.addcslashes($search, '%_\\').'%');
        }
        return $qb->getQuery()->getResult();
    }
}
