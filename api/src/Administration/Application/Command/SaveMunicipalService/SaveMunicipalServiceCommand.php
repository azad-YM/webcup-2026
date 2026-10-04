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
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $name,
        #[Assert\NotBlank] #[Assert\Length(max: 40)] public string $category,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\NotBlank] #[Assert\Length(max: 10000)] public string $description,
        #[Assert\Count(max: 50)] public array $actions = [],
        #[Assert\Count(max: 3)] public array $contact = [],
        public bool $featured = false,
        #[Assert\Count(max: 50)] public array $keywords = [],
        #[Assert\Choice(['available', 'maintenance', 'incident'])] public string $status = 'available',
        #[Assert\Length(max: 2000)] public string $statusMessage = '',
        #[Assert\Length(max: 40)] public ?string $returnAt = null,
        #[Assert\Length(max: 2000)] public string $alternative = '',
        public ?array $transport = null,
    ) {}
}
