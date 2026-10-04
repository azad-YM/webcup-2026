<?php

declare(strict_types=1);

namespace Citizen\Application\Command\WelcomeNewResident;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * F71: an agent creates, at the city reception, the account of a newcomer who may have no e-mail.
 * The preferred language (fr, en, ar) is used for the printed welcome sheet and the interface.
 */
final readonly class WelcomeNewResidentCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 100)] public string $firstName,
        #[Assert\NotBlank] #[Assert\Length(max: 100)] public string $lastName,
        #[Assert\Choice(['fr', 'en', 'ar'])] public string $preferredLanguage = 'fr',
        #[Assert\Length(max: 30)] public ?string $phone = null,
        #[Assert\Email] #[Assert\Length(max: 255)] public ?string $email = null,
        #[Assert\Length(max: 100)] public ?string $district = null,
    ) {}
}
