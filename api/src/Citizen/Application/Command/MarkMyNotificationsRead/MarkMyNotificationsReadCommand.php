<?php

declare(strict_types=1);

namespace Citizen\Application\Command\MarkMyNotificationsRead;

use Symfony\Component\Validator\Constraints as Assert;

/** `ids` absent ou vide : toutes les notifications non lues du citoyen connecté. */
final readonly class MarkMyNotificationsReadCommand
{
    /** @param list<string> $ids */
    public function __construct(
        #[Assert\Count(max: 200)]
        #[Assert\All([new Assert\Type('string'), new Assert\Length(max: 36)])]
        public array $ids = [],
    ) {}
}
