<?php
namespace Communication\Application\Ports\Repository;
use Communication\Domain\Entity\Publication;
interface PublicationRepository { public function save(Publication $publication): void; /** @return list<Publication> */ public function all(): array; }
