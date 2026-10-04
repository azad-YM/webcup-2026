<?php

declare(strict_types=1);

namespace Shared\Infrastructure\FormGuard;

use Shared\Application\Ports\Service\AbuseSignals;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F81 (ADR 012) : protection invisible des formulaires publics et citoyens contre les envois automatiques.
 *
 * Les formulaires protégés sont déclarés par nom de route dans `config/packages/platform.yaml`
 * (`app.form_guard.forms`) : Shared ne connaît aucun BC. Pour une personne, rien ne change :
 * - champ piège (`X-Form-Trap`) rempli → refus net (un humain ne voit pas ce champ) ;
 * - jeton de formulaire absent, falsifié, expiré ou envoi plus rapide que le délai minimal → **défi** :
 *   réponse `428` avec une question en langage clair ; le formulaire la pose et renvoie la réponse
 *   (`X-Form-Challenge: <jeton>:<réponse>`) ;
 * - une bonne réponse au défi laisse passer, même sans jeton.
 * Chaque refus et chaque défi deviennent un signal `AbuseSignals` (compteur de l'écran « Activité inhabituelle »).
 * Après le limiteur de débit (priorité 16), avant le pare-feu.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 15)]
final readonly class FormGuardListener
{
    /** @param array<string, array{form: string, min_seconds?: int}> $forms */
    public function __construct(
        private FormGuardSigner $signer,
        private AbuseSignals $signals,
        #[Autowire('%app.form_guard.forms%')] private array $forms,
        #[Autowire('%app.form_guard.enabled%')] private bool $enabled = true,
    ) {}

    public function __invoke(RequestEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');
        if (!is_string($route) || !isset($this->forms[$route]) || in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $form = $this->forms[$route]['form'];
        $client = (string) ($request->getClientIp() ?? 'inconnu');

        if (trim((string) $request->headers->get('X-Form-Trap', '')) !== '') {
            $this->signals->record(AbuseSignals::FORM_REJECTED, $form, $client);
            $event->setResponse(new JsonResponse([
                'code' => 'form_rejected',
                'error' => 'Votre envoi n’a pas été accepté : il ressemble à un envoi automatique. Si vous êtes une personne, rechargez la page puis réessayez.',
            ], 400));

            return;
        }

        $answer = (string) $request->headers->get('X-Form-Challenge', '');
        if ($answer !== '') {
            if ($this->signer->solves($answer)) {
                return;
            }
            $this->challenge($event, $form, $client, 'challenge_failed', 'La réponse n’est pas la bonne. Voici une nouvelle question.');

            return;
        }

        if ($this->looksHuman($request, $form, (int) ($this->forms[$route]['min_seconds'] ?? 3))) {
            return;
        }
        $this->challenge($event, $form, $client, 'challenge_required', 'Pour confirmer que cet envoi vient bien d’une personne, répondez à cette petite question.');
    }

    private function looksHuman(Request $request, string $form, int $minSeconds): bool
    {
        $token = (string) $request->headers->get('X-Form-Token', '');
        $issuedAt = $token === '' ? null : $this->signer->issuedAt($token, $form);

        return $issuedAt !== null && time() - $issuedAt >= $minSeconds;
    }

    private function challenge(RequestEvent $event, string $form, string $client, string $code, string $message): void
    {
        $this->signals->record(AbuseSignals::FORM_CHALLENGED, $form, $client);
        $event->setResponse(new JsonResponse([
            'code' => $code,
            'error' => $message,
            'challenge' => $this->signer->challenge(),
        ], 428));
    }
}
