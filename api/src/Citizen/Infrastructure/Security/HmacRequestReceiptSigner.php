<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Security;

use Citizen\Application\Ports\Service\RequestReceiptSigner;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** HMAC-SHA256 tronqué à 10 caractères (base 32 sans caractères ambigus), clé dérivée du secret de l'application. */
final readonly class HmacRequestReceiptSigner implements RequestReceiptSigner
{
    private const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    public function __construct(#[Autowire('%kernel.secret%')] private string $secret) {}

    public function fingerprint(string $payload): string
    {
        $bytes = hash_hmac('sha256', $payload, 'citizen-receipt|' . $this->secret, true);
        $out = '';
        for ($i = 0; $i < 10; ++$i) {
            $out .= self::ALPHABET[ord($bytes[$i]) % 32];
        }

        return substr($out, 0, 5) . '-' . substr($out, 5);
    }
}
