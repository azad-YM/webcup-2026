<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListCitizenAccounts;

final readonly class ListCitizenAccountsQuery
{
    /** @param ?string $search name, e-mail, phone or district fragment; null lists every account */
    public function __construct(public ?string $search = null, public ?string $status = null) {}
}
