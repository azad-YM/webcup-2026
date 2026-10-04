<?php

declare(strict_types=1);

namespace IAM\Application\Ports\Service;

/** E-mails de sécurité du compte (L15), en texte clair et en français. */
interface AccountMailer
{
    /** D02 : lien de connexion vers la page `/connexion/lien` du site. */
    public function sendLoginLink(string $to, string $token, int $minutes): void;

    /** F53 : code à 6 chiffres ; `$purpose` = `sign_in` (connexion) ou `reconfirm` (confirmation d'identité). */
    public function sendVerificationCode(string $to, string $code, string $purpose, int $minutes): void;

    /** F54 : connexion depuis un nouvel appareil. */
    public function sendNewDeviceAlert(string $to, string $deviceLabel, \DateTimeImmutable $at): void;
}
