<?php

declare(strict_types=1);

namespace Citizen\Application\Query\GetMyRequestReceipt;

final readonly class GetMyRequestReceiptQuery
{
    public function __construct(public string $reference) {}
}
