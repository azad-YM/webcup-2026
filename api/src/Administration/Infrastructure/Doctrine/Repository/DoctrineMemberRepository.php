<?php

declare(strict_types=1);

namespace Administration\Infrastructure\Doctrine\Repository;

use Administration\Application\Ports\Repository\MemberRepository;
use Administration\Domain\Entity\Member;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class DoctrineMemberRepository implements MemberRepository
{
    public function __construct(private EntityManagerInterface $manager, private MessageBusInterface $eventBus) {}

    public function save(Member $member): void
    {
        $this->manager->persist($member);
        foreach ($member->pullDomainEvents() as $event) {
            $this->eventBus->dispatch($event);
        }
    }
    public function findByUserId(string $userId): ?Member { return $this->manager->getRepository(Member::class)->findOneBy(['userId' => $userId]); }

    public function findAll(): array
    {
        return array_values($this->manager->getRepository(Member::class)->findBy([], ['name' => 'ASC', 'id' => 'ASC']));
    }
}
