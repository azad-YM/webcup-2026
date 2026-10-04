<?php

declare(strict_types=1);

namespace Citizen\Application\Ports\Service;

use Citizen\Application\ViewModel\RequestReceiptView;

/** F83 : envoi de l'accusé de réception par e-mail (Mailer, via le worker). */
interface RequestReceiptMailer
{
    public function send(string $to, RequestReceiptView $receipt): void;
}
