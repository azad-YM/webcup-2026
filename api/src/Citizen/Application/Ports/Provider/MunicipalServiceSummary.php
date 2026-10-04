<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Provider;

/**
 * DTO contractuel du port `MunicipalServiceDirectory`.
 *
 * L18 : `disabled` (F63, désactivation d'urgence par un administrateur) interdit toute nouvelle demande ou réservation
 * visant le service ; `status` (F38 : `available`, `maintenance`, `incident`) et ses textes sont montrés au citoyen
 * avant la démarche (F64), sans bloquer.
 */
final readonly class MunicipalServiceSummary
{
    public function __construct(
        public string $id,
        public string $name,
        public string $place,
        public string $hours,
        public bool $disabled = false,
        public string $disabledReason = '',
        public string $status = 'available',
        public string $statusMessage = '',
        public string $alternative = '',
        public ?string $returnAt = null,
        public ?string $phone = null,
    ) {}

    /** @return array{state: string, disabled: bool, status: string, message: string, alternative: string, returnAt: ?string, place: string, hours: string, phone: ?string} */
    public function availability(): array
    {
        return [
            'state' => $this->disabled ? 'disabled' : ($this->status === 'available' ? 'available' : 'disrupted'),
            'disabled' => $this->disabled,
            'status' => $this->status,
            'message' => $this->disabled ? $this->disabledReason : $this->statusMessage,
            'alternative' => $this->alternative,
            'returnAt' => $this->returnAt,
            'place' => $this->place,
            'hours' => $this->hours,
            'phone' => $this->phone,
        ];
    }
}
