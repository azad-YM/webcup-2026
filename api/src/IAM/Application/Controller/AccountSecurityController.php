<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Command\ChangeMyPassword\ChangeMyPasswordCommand;
use IAM\Application\Command\ReportUnknownDevice\ReportUnknownDeviceCommand;
use IAM\Application\Command\SendReconfirmationCode\SendReconfirmationCodeCommand;
use IAM\Application\Command\SetEmailVerification\SetEmailVerificationCommand;
use IAM\Application\Query\GetMyAccountSecurity\GetMyAccountSecurityQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** « Sécurité du compte » du compte connecté (F53, F54). */
final class AccountSecurityController extends AppController
{
    use RendersOutcome;

    #[Route('/api/iam/me/security', name: 'iam_my_security', methods: ['GET'], format: 'json')]
    public function show(): JsonResponse { return $this->dispatchQuery(new GetMyAccountSecurityQuery()); }

    /** Aucun payload : le code est envoyé à l'adresse du compte connecté. */
    #[Route('/api/iam/me/reconfirmation-codes', name: 'iam_my_reconfirmation_code', methods: ['POST'], format: 'json')]
    public function sendCode(): JsonResponse { return $this->outcome($this->dispatch(new SendReconfirmationCodeCommand())); }

    #[Route('/api/iam/me/email-verification', name: 'iam_my_email_verification', methods: ['PUT'], format: 'json')]
    public function emailVerification(#[MapRequestPayload] SetEmailVerificationCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }

    #[Route('/api/iam/me/devices/report', name: 'iam_my_device_report', methods: ['POST'], format: 'json')]
    public function reportDevice(#[MapRequestPayload] ReportUnknownDeviceCommand $cmd): JsonResponse { return $this->dispatch($cmd); }

    #[Route('/api/iam/me/password', name: 'iam_my_password', methods: ['PUT'], format: 'json')]
    public function changePassword(#[MapRequestPayload] ChangeMyPasswordCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }
}
