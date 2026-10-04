<?php

declare(strict_types=1);

namespace Audit\Application\Command\ChangeAnomalyStatus;

use Symfony\Component\Validator\Constraints as Assert;

/** F85 : marquer une anomalie comme vue ou traitée (ou la rouvrir). */
final readonly class ChangeAnomalyStatusCommand
{
    public function __construct(
        #[Assert\NotBlank, Assert\Length(max: 36)]
        public string $id = '',
        #[Assert\Choice(choices: ['new', 'seen', 'handled'], message: 'Statut attendu : nouvelle, vue ou traitée.')]
        public string $status = 'seen',
    ) {}
}
