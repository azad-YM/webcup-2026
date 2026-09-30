<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Doctrine\Repository;
use Doctrine\ORM\EntityManagerInterface;
use IAM\Application\Ports\Repository\PortalLoginCodeRepository;
use IAM\Domain\Entity\PortalLoginCode;
final readonly class DoctrinePortalLoginCodeRepository implements PortalLoginCodeRepository
{
    public function __construct(private EntityManagerInterface $manager) {}
    public function save(PortalLoginCode $code): void { $this->manager->persist($code); }
    public function consume(string $hash, string $destination, string $challenge, int $now): ?PortalLoginCode
    {
        $db = $this->manager->getConnection();
        $params = ['hash' => $hash, 'destination' => $destination, 'challenge' => $challenge, 'now' => $now];
        $where = 'hash = :hash AND destination = :destination AND BINARY challenge = :challenge AND expires_at > :now AND session_expires_at > :now';
        $row = $db->fetchAssociative('SELECT * FROM iam_portal_login_codes WHERE '.$where, $params);
        if ($row === false || $db->executeStatement('DELETE FROM iam_portal_login_codes WHERE '.$where, $params) !== 1) return null;
        return new PortalLoginCode($row['hash'], $row['user_id'], $row['email'], $row['destination'], $row['challenge'], $row['session_hash'], (int) $row['expires_at'], (int) $row['session_expires_at']);
    }
}
