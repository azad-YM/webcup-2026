<?php

declare(strict_types=1);
namespace Citizen\Application\Query\ListServiceRequests;
final readonly class ListServiceRequestsQuery {public function __construct(public bool $agent=false,public ?string $status=null,public int $page=1){}}
