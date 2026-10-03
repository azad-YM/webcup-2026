<?php

declare(strict_types=1);

namespace Citizen\Application\Command\SubmitServiceRequest;

use Citizen\Domain\Entity\ServiceRequest;
use Symfony\Component\Validator\Constraints as Assert;

/** L'auteur n'est jamais dans le payload : c'est le citoyen du compte connecté. */
final readonly class SubmitServiceRequestCommand
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ServiceRequest::TYPES)]
        public string $type = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: ServiceRequest::SUBJECT_MAX)]
        public string $subject = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: ServiceRequest::DESCRIPTION_MAX)]
        public string $description = '',
        #[Assert\Length(max: ServiceRequest::LOCATION_MAX)]
        public ?string $location = null,
        #[Assert\Length(max: ServiceRequest::SERVICE_ID_MAX)]
        public ?string $serviceId = null,
    ) {}
}
