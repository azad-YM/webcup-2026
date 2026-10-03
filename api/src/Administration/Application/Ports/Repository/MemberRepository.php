<?php

declare(strict_types=1);

namespace Administration\Application\Ports\Repository;

use Administration\Domain\Entity\Member;

interface MemberRepository
{
    public function save(Member $member): void;
    public function findByUserId(string $userId): ?Member;
}
