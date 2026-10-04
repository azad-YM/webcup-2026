<?php

declare(strict_types=1);

namespace Communication\Application\Command\SaveAlert;

use Symfony\Component\Validator\Constraints as Assert;

/** Creates (without id) or revises an alert, and sets its state. Dates in ISO 8601. */
final readonly class SaveAlertCommand
{
    /** @param list<string> $recommendations */
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 200)] public string $title,
        #[Assert\NotBlank] #[Assert\Length(max: 5000)] public string $message,
        #[Assert\Choice(['info', 'warning', 'critical'])] public string $severity,
        #[Assert\Choice(['all', 'district', 'health'])] public string $audience,
        #[Assert\NotBlank] public string $startsAt,
        #[Assert\NotBlank] public string $endsAt,
        public ?string $district = null,
        #[Assert\Count(max: 50)] public array $recommendations = [],
        #[Assert\Choice(['draft', 'published', 'withdrawn'])] public string $state = 'draft',
        #[Assert\Length(max: 80)] public ?string $id = null,
        /** F73 : `official` = message officiel du Haut Conseil (tous les habitants, signataire obligatoire). */
        #[Assert\Choice(['standard', 'official'])] public string $category = 'standard',
        #[Assert\Length(max: 160)] public ?string $signatory = null,
        /** F73 : la publication d'un message officiel doit être confirmée explicitement. */
        public bool $confirmOfficial = false,
    ) {}
}
