<?php
namespace Communication\Application\DTO;
final readonly class Audience { public function __construct(public string $citizenId,public ?string $district,public bool $healthConsent) {} }
