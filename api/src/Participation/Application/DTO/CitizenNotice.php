<?php

declare(strict_types=1);

namespace Participation\Application\DTO;

/** Contract of `CitizenNotifier`: a short French message with a link to a page of the site. */
final readonly class CitizenNotice
{
    public function __construct(
        public string $citizenId,
        public string $sourceKey,
        public string $title,
        public string $message,
        public ?string $link = null,
    ) {}
}
