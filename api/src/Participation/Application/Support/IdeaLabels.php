<?php

declare(strict_types=1);

namespace Participation\Application\Support;

/** French labels used in the notifications and the action journal (the site has its own labels). */
final class IdeaLabels
{
    public const STATUS = [
        'received' => 'reçue',
        'in_review' => 'à l’étude',
        'accepted' => 'retenue',
        'rejected' => 'non retenue',
        'done' => 'réalisée',
    ];
}
