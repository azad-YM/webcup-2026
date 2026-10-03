<?php
namespace Citizen\Application\Ports\Repository;
use Citizen\Domain\Entity\AlertPreference;
interface AlertPreferenceRepository { public function get(string $citizenId): AlertPreference; public function save(AlertPreference $preference): void; }
