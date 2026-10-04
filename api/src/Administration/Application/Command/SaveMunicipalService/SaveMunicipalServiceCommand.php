<?php

declare(strict_types=1);

namespace Administration\Application\Command\SaveMunicipalService;

use Symfony\Component\Validator\Constraints as Assert;

/** Creates or replaces a service of the catalogue (agent with `admin.service.write`). */
final readonly class SaveMunicipalServiceCommand
{
    /**
     * @param list<string> $actions
     * @param array{place?: string, hours?: string, phone?: ?string, person?: string, email?: string, website?: string, openingHours?: list<array{day: int, opens: string, closes: string}>} $contact
     * @param list<string> $keywords
     * @param array{route?: string, timetable?: string, information?: string}|null $transport
     * @param array{address?: string, district?: ?string, lat?: float, lng?: float}|null $location F45
     * @param array<string, array{name?: string, summary?: string, description?: string}>|null $translations F27
     */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 80)] public string $id,
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $name,
        #[Assert\NotBlank] #[Assert\Length(max: 40)] public string $category,
        #[Assert\NotBlank] #[Assert\Length(max: 1000)] public string $summary,
        #[Assert\NotBlank] #[Assert\Length(max: 10000)] public string $description,
        #[Assert\Count(max: 50)] public array $actions = [],
        #[Assert\Count(max: 7)] public array $contact = [],
        public bool $featured = false,
        #[Assert\Count(max: 50)] public array $keywords = [],
        #[Assert\Choice(['available', 'maintenance', 'incident'])] public string $status = 'available',
        #[Assert\Length(max: 2000)] public string $statusMessage = '',
        #[Assert\Length(max: 40)] public ?string $returnAt = null,
        #[Assert\Length(max: 2000)] public string $alternative = '',
        public ?array $transport = null,
        public ?array $location = null,
        #[Assert\Choice(['hospital', 'emergency', 'fire', 'police', 'pharmacy'])] public ?string $emergency = null,
        public ?array $translations = null,
        /** F89 : version « En clair » relue par l'agent ; l'enregistrer vaut validation. */
        #[Assert\Length(max: 600)] public string $plainLanguage = '',
    ) {}
}
