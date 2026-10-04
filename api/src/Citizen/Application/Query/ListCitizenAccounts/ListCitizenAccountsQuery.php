<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListCitizenAccounts;

final readonly class ListCitizenAccountsQuery
{
    /** @param ?string $search name, e-mail or district fragment (phone only once sensitive data is revealed); null lists every account */
    /** @param bool $reveal F70 : afficher les données sensibles (agent habilité, consultation journalisée) */
    public function __construct(public ?string $search = null, public ?string $status = null, public bool $reveal = false) {}
}
