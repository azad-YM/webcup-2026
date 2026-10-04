<?php

declare(strict_types=1);

namespace Participation\Application\Command\HandleServiceReview;

use Symfony\Component\Validator\Constraints as Assert;

/** F76 : un agent marque un avis comme lu ou y répond. */
final readonly class HandleServiceReviewCommand
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Length(max: 36)] public string $reviewId,
        #[Assert\Choice(['read', 'respond'])] public string $action,
        #[Assert\Length(max: 2000)] public ?string $response = null,
    ) {}
}
