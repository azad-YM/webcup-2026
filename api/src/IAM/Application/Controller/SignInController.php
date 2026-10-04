<?php

declare(strict_types=1);

namespace IAM\Application\Controller;

use IAM\Application\Command\ConsumeLoginLink\ConsumeLoginLinkCommand;
use IAM\Application\Command\RequestLoginLink\RequestLoginLinkCommand;
use IAM\Application\Command\ResendSignInCode\ResendSignInCodeCommand;
use IAM\Application\Command\VerifySignInCode\VerifySignInCodeCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Connexion sans mot de passe (D02) et seconde étape par code e-mail (F53) : routes publiques, POST seulement. */
final class SignInController extends AppController
{
    use RendersOutcome;

    #[Route('/api/iam/login-links', name: 'iam_login_link_request', methods: ['POST'], format: 'json')]
    public function requestLink(#[MapRequestPayload] RequestLoginLinkCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }

    #[Route('/api/iam/login-links/consume', name: 'iam_login_link_consume', methods: ['POST'], format: 'json')]
    public function consumeLink(#[MapRequestPayload] ConsumeLoginLinkCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }

    #[Route('/api/iam/sign-in/verify', name: 'iam_sign_in_verify', methods: ['POST'], format: 'json')]
    public function verify(#[MapRequestPayload] VerifySignInCodeCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }

    #[Route('/api/iam/sign-in/resend', name: 'iam_sign_in_resend', methods: ['POST'], format: 'json')]
    public function resend(#[MapRequestPayload] ResendSignInCodeCommand $cmd): JsonResponse { return $this->outcome($this->dispatch($cmd)); }
}
