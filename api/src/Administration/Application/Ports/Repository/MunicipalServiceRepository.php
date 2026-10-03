<?php
namespace Administration\Application\Ports\Repository;
use Administration\Domain\Entity\MunicipalService;
interface MunicipalServiceRepository { public function save(MunicipalService $service): void; /** @return list<MunicipalService> */ public function all(): array; }
