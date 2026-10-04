<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;

use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\SignInRecordRepository;
use IAM\Domain\Entity\SignInRecord;

final readonly class DoctrineSignInRecordRepository implements SignInRecordRepository
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function add(SignInRecord $record): void
    {
        $this->manager->persist($record);
        $this->manager->getConnection()->executeStatement(
            'DELETE FROM iam_sign_ins WHERE user_id = ? AND occurred_at < ?',
            [$record->userId, $record->occurredAt->modify(sprintf('-%d days', SignInRecord::RETENTION_DAYS))->format('Y-m-d H:i:s')],
        );
    }

    public function recentByUser(string $userId, int $limit): array
    {
        return array_values($this->manager->getRepository(SignInRecord::class)->findBy(['userId' => $userId], ['occurredAt' => 'DESC'], $limit));
    }
}
