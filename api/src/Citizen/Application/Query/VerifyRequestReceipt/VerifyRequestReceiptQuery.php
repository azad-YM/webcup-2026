<?php

declare(strict_types=1);

namespace Citizen\Application\Query\VerifyRequestReceipt;

use Symfony\Component\Validator\Constraints as Assert;

/** F83 : vérification publique d'un accusé (référence + empreinte), sans révéler le contenu. */
final readonly class VerifyRequestReceiptQuery
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 30)]
        public string $reference = '',
        #[Assert\NotBlank]
        #[Assert\Length(max: 30)]
        public string $fingerprint = '',
    ) {}
}
