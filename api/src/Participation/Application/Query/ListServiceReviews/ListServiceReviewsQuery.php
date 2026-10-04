<?php

declare(strict_types=1);

namespace Participation\Application\Query\ListServiceReviews;

/** F76 : file des avis pour les agents (sans identité de l'habitant). */
final readonly class ListServiceReviewsQuery
{
    public function __construct(public ?string $status = null, public ?string $serviceId = null) {}
}
