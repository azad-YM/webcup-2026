<?php

declare(strict_types=1);

namespace Shared\Infrastructure\FormGuard\Http;

use Shared\Infrastructure\FormGuard\FormGuardSigner;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * F81 : jeton d'un formulaire protégé, demandé par le navigateur à l'affichage du formulaire.
 * Public (inscription, lien de connexion) ; ne révèle rien d'autre que le délai minimal attendu.
 */
final readonly class FormGuardController
{
    /** @param array<string, array{form: string, min_seconds?: int}> $forms */
    public function __construct(
        private FormGuardSigner $signer,
        #[Autowire('%app.form_guard.forms%')] private array $forms,
    ) {}

    #[Route('/api/forms/token', name: 'shared_form_token', methods: ['GET'])]
    public function token(Request $request): JsonResponse
    {
        $form = $request->query->getString('form');
        $minSeconds = null;
        foreach ($this->forms as $rule) {
            if ($rule['form'] === $form) {
                $minSeconds = (int) ($rule['min_seconds'] ?? 3);
                break;
            }
        }
        if ($minSeconds === null) {
            return new JsonResponse(['error' => 'Formulaire inconnu.'], 404);
        }
        $response = new JsonResponse(['token' => $this->signer->issue($form), 'minSeconds' => $minSeconds, 'expiresIn' => FormGuardSigner::TOKEN_LIFETIME]);
        $response->headers->set('Cache-Control', 'no-store');

        return $response;
    }
}
