<?php

declare(strict_types=1);

namespace Participation\Application\Command\ReviewService;

use Symfony\Component\Validator\Constraints as Assert;

/** F76 : un habitant connecté donne (ou modifie) son avis du mois sur un service municipal. */
final readonly class ReviewServiceCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 100)] public string $serviceId,
        #[Assert\Range(min: 1, max: 5)] public int $rating,
        #[Assert\Choice(['yes', 'partly', 'no'])] public string $needMet,
        #[Assert\Length(max: 2000)] public ?string $comment = null,
        /** D'où vient l'avis : fiche service, demande close ou rendez-vous passé. */
        #[Assert\Choice(['service', 'request', 'appointment'])] public string $context = 'service',
        #[Assert\Length(max: 40)] public ?string $contextReference = null,
    ) {}
}
