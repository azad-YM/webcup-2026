<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\UpdateRequestTracking;

use Symfony\Component\Validator\Constraints as Assert;

final class UpdateRequestTrackingCommand
{
    /** Set from the route `{requestCode}`, not from the payload. */
    public string $requestCode = '';

    /** @param list<array{label: string, url: string}> $links */
    public function __construct(
        #[Assert\Choice(['todo', 'in_progress', 'done'])] public string $status = 'todo',
        #[Assert\Count(max: 10)] #[Assert\All([new Assert\Collection(fields: [
            'label' => [new Assert\NotBlank(), new Assert\Length(max: 80)],
            'url' => [new Assert\NotBlank(), new Assert\Length(max: 500), new Assert\Url(protocols: ['http', 'https'], requireTld: false)],
        ])])] public array $links = [],
        #[Assert\Length(max: 500)] public string $note = '',
    ) {}
}
