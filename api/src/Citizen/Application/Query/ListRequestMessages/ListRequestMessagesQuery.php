<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListRequestMessages;

/** F84 : fil de messages d'une demande, vu par un agent. */
final readonly class ListRequestMessagesQuery
{
    public function __construct(public string $requestId) {}
}
