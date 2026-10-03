<?php
namespace Citizen\Domain\Entity;
final class AlertPreference { public function __construct(public readonly string $citizenId,public bool $healthConsent=false) {} }
