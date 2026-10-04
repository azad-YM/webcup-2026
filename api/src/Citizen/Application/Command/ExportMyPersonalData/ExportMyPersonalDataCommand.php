<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ExportMyPersonalData;

use Symfony\Component\Validator\Constraints as Assert;

/** F55 : export de ses données, après confirmation par mot de passe **ou** par code reçu par e-mail. */
final readonly class ExportMyPersonalDataCommand
{
    public function __construct(
        #[\SensitiveParameter] #[Assert\Length(max: 4096)]
        public ?string $password = null,
        #[\SensitiveParameter] #[Assert\Regex('/^[a-f0-9]{64}$/D')]
        public ?string $challengeId = null,
        #[\SensitiveParameter] #[Assert\Regex('/^[0-9]{6}$/D', message: 'Le code comporte 6 chiffres.')]
        public ?string $code = null,
    ) {}
}
