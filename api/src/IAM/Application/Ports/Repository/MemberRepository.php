<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Repository;

use IAM\Domain\Entity\Member;

interface MemberRepository
{
    public function save(Member $member): void;
    public function findByUserId(string $userId): ?Member;
}
