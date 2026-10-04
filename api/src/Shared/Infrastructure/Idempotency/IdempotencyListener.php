<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Idempotency;

use Doctrine\DBAL\Connection;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * F82 (ADR 012) : un même envoi rejoué (double clic, retour arrière, réseau qui renvoie) ne crée rien de plus.
 *
 * Le navigateur génère une clé `Idempotency-Key` par intention d'envoi. Pour toute écriture (POST, PUT, PATCH,
 * DELETE) qui porte cette clé :
 * - premier passage : la clé est réservée (`pending`) avant le contrôleur, puis la réponse réussie (2xx) est
 *   conservée 24 h ; une réponse en erreur libère la clé pour permettre de corriger et réessayer ;
 * - même clé, même contenu, réponse conservée → la **même réponse** est rendue, avec `Idempotent-Replayed: true` ;
 * - même clé pendant le traitement du premier envoi → `409 submission_in_progress` ;
 * - même clé, contenu différent → `422 idempotency_key_reused`.
 * La clé est liée à la route et à la session (empreinte de l'en-tête `Authorization`, sinon de l'adresse) :
 * un autre compte ne peut pas lire la réponse d'un autre. Les routes qui rendent un jeton de session ne sont
 * jamais conservées (`app.idempotency.excluded_routes`). Sans clé, rien ne change. Une panne de la base laisse passer.
 */
final readonly class IdempotencyListener
{
    public const HEADER = 'Idempotency-Key';
    public const REPLAYED_HEADER = 'Idempotent-Replayed';
    private const TTL_SECONDS = 86400;
    private const STALE_PENDING_SECONDS = 60;
    private const MAX_BODY_BYTES = 65535;
    private const ATTRIBUTE = '_idempotency_id';

    /** @param list<string> $excludedRoutes */
    public function __construct(
        private Connection $connection,
        #[Autowire('%app.idempotency.excluded_routes%')] private array $excludedRoutes,
        #[Autowire('%app.idempotency.enabled%')] private bool $enabled = true,
        private ?LoggerInterface $logger = null,
    ) {}

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 20)]
    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$this->enabled || !$event->isMainRequest() || !in_array($request->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }
        $key = (string) $request->headers->get(self::HEADER, '');
        $route = $request->attributes->get('_route');
        if ($key === '' || !is_string($route) || in_array($route, $this->excludedRoutes, true)) {
            return;
        }
        if (preg_match('/^[A-Za-z0-9_-]{8,100}$/D', $key) !== 1) {
            $event->setResponse(new JsonResponse(['code' => 'invalid_idempotency_key', 'error' => 'La clé d’envoi est mal formée. Rechargez la page puis réessayez.'], 400));

            return;
        }
        $session = (string) ($request->headers->get('Authorization') ?? $request->getClientIp() ?? '');
        $id = hash('sha256', $route.'|'.$key.'|'.$session);
        $requestHash = hash('sha256', $request->getMethod().' '.$request->getPathInfo().'?'.$request->getQueryString()."\n".$request->getContent());
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));

        try {
            $row = $this->connection->fetchAssociative('SELECT request_hash, state, status_code, body, created_at, expires_at FROM idempotency_keys WHERE id = ?', [$id]);
            if ($row !== false && $row['expires_at'] > $now->format('Y-m-d H:i:s')) {
                if (!hash_equals((string) $row['request_hash'], $requestHash)) {
                    $event->setResponse(new JsonResponse(['code' => 'idempotency_key_reused', 'error' => 'Ce formulaire a déjà été envoyé avec un autre contenu. Rechargez la page pour faire un nouvel envoi.'], 422));

                    return;
                }
                if ($row['state'] === 'done') {
                    $response = new Response((string) $row['body'], (int) $row['status_code'], ['Content-Type' => 'application/json']);
                    $response->headers->set(self::REPLAYED_HEADER, 'true');
                    $event->setResponse($response);

                    return;
                }
                $stale = $row['created_at'] < $now->modify(sprintf('-%d seconds', self::STALE_PENDING_SECONDS))->format('Y-m-d H:i:s');
                if (!$stale) {
                    $response = new JsonResponse(['code' => 'submission_in_progress', 'error' => 'Votre envoi est déjà en cours de traitement. Patientez quelques secondes sans renvoyer le formulaire.'], 409);
                    $response->headers->set('Retry-After', '3');
                    $event->setResponse($response);

                    return;
                }
            }
            // Réservation (ou reprise d'une réservation expirée ou abandonnée).
            $this->connection->executeStatement(
                'INSERT INTO idempotency_keys (id, request_hash, state, status_code, body, created_at, expires_at) VALUES (?, ?, ?, NULL, NULL, ?, ?)
                 ON DUPLICATE KEY UPDATE request_hash = VALUES(request_hash), state = VALUES(state), status_code = NULL, body = NULL, created_at = VALUES(created_at), expires_at = VALUES(expires_at)',
                [$id, $requestHash, 'pending', $now->format('Y-m-d H:i:s'), $now->modify(sprintf('+%d seconds', self::TTL_SECONDS))->format('Y-m-d H:i:s')],
            );
            if (random_int(1, 100) === 1) {
                $this->connection->executeStatement('DELETE FROM idempotency_keys WHERE expires_at < ? LIMIT 500', [$now->format('Y-m-d H:i:s')]);
            }
            $request->attributes->set(self::ATTRIBUTE, $id);
        } catch (\Throwable $exception) {
            $this->logger?->warning('Idempotency store unavailable: request processed without protection.', ['exception' => $exception::class]);
        }
    }

    #[AsEventListener(event: KernelEvents::RESPONSE, priority: -20)]
    public function onResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        $id = $request->attributes->get(self::ATTRIBUTE);
        if (!$event->isMainRequest() || !is_string($id)) {
            return;
        }
        $request->attributes->remove(self::ATTRIBUTE);
        $response = $event->getResponse();
        $body = (string) $response->getContent();
        try {
            if ($response->isSuccessful() && strlen($body) <= self::MAX_BODY_BYTES && self::isJson($response)) {
                $this->connection->executeStatement(
                    "UPDATE idempotency_keys SET state = 'done', status_code = ?, body = ? WHERE id = ?",
                    [$response->getStatusCode(), $body, $id],
                );

                return;
            }
            // Erreur ou réponse non conservable : la clé est libérée, l'usager peut corriger et renvoyer.
            $this->connection->executeStatement('DELETE FROM idempotency_keys WHERE id = ?', [$id]);
        } catch (\Throwable $exception) {
            $this->logger?->warning('Idempotency response not stored.', ['exception' => $exception::class]);
        }
    }

    private static function isJson(Response $response): bool
    {
        return str_contains((string) $response->headers->get('Content-Type', 'application/json'), 'json');
    }
}
