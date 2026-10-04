<?php

declare(strict_types=1);

namespace IAM\Application\Command\ReportUnknownDevice;

use Symfony\Component\Validator\Constraints as Assert;

/** F54 : « Ce n'était pas moi » sur un appareil de la liste « Sécurité du compte ». */
final readonly class ReportUnknownDeviceCommand
{
    public function __construct(
        #[Assert\NotBlank, Assert\Length(max: 36)]
        public string $deviceId,
    ) {}
}
