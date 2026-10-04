<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestQueue;

final readonly class ListRequestQueueQuery
{
    public function __construct(
        public ?string $status = null,
        public int $page = 1,
        /** F70 : afficher le lieu des demandes de contact (adresse personnelle possible), agent habilité, journalisé. */
        public bool $reveal = false,
        /** F80 : filtre facultatif par priorité. */
        public ?string $priority = null,
    ) {}
}
