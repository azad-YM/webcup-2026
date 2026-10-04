<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyRequestMessages;

/** F84 : fil de messages d'une demande de l'habitant connecté. */
final readonly class ListMyRequestMessagesQuery
{
    public function __construct(public string $reference) {}
}
