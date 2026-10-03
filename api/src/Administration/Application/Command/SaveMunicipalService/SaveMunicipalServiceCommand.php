<?php

declare(strict_types=1);

namespace Administration\Application\Command\SaveMunicipalService;

use Symfony\Component\Validator\Constraints as Assert;

/** Creates or replaces a service of the catalogue (agent with `admin.service.write`). */
final readonly class SaveMunicipalServiceCommand
{
    /**
     * @param list<string> $actions
     * @param array{place?: string, hours?: string, phone?: ?string} $contact
     * @param list<string> $keywords
     * @param array{route?: string, timetable?: string, information?: string}|null $transport
     */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 80)] public string $id,
        #[Assert\NotBlank] public string $name,
        #[Assert\NotBlank] public string $category,
        #[Assert\NotBlank] public string $summary,
        #[Assert\NotBlank] public string $description,
        public array $actions = [],
        public array $contact = [],
        public bool $featured = false,
        public array $keywords = [],
        #[Assert\Choice(['available', 'maintenance', 'incident'])] public string $status = 'available',
        public string $statusMessage = '',
        public ?string $returnAt = null,
        public string $alternative = '',
        public ?array $transport = null,
    ) {}
}
