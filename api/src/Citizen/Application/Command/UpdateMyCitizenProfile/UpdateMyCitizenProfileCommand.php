<?php

declare(strict_types=1);

namespace Citizen\Application\Command\UpdateMyCitizenProfile;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Remplace le profil du citoyen connecté (PUT) : un champ absent ou vide est enregistré à null.
 * L'identité vient du compte connecté, jamais du payload.
 */
final readonly class UpdateMyCitizenProfileCommand
{
    public function __construct(
        #[Assert\Length(max: 100)]
        public ?string $firstName = null,
        #[Assert\Length(max: 100)]
        public ?string $lastName = null,
        #[Assert\Length(max: 30)]
        // F69 : format strict (chiffres, espaces, +, points, tirets, parenthèses) — champ chiffré au repos.
        #[Assert\Regex(pattern: '/^\+?[0-9 .()\-]{6,30}$/', message: 'Numéro de téléphone invalide : chiffres, espaces et + seulement.')]
        public ?string $phone = null,
        #[Assert\Length(max: 255)]
        public ?string $address = null,
        #[Assert\Length(max: 100)]
        public ?string $district = null,
        #[Assert\Length(max: 5)]
        public ?string $preferredLanguage = null,
    ) {}
}
