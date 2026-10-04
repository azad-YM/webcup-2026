<?php

declare(strict_types=1);

namespace Shared\Infrastructure\FormGuard;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * F81 (ADR 012) : jetons sans état, signés HMAC avec le secret du noyau.
 *
 * - **Jeton de formulaire** : nom du formulaire + heure d'émission + nonce. Il prouve que le formulaire a été
 *   affiché par un navigateur et permet de mesurer le délai de remplissage (un robot envoie en moins d'une seconde).
 * - **Défi** : une question en langage clair (« Combien font 3 + 4 ? ») dont seule l'empreinte de la réponse est
 *   signée, avec une expiration. Aucun service tiers, aucun stockage.
 */
final readonly class FormGuardSigner
{
    public const TOKEN_LIFETIME = 7200;
    public const CHALLENGE_LIFETIME = 600;

    private const NUMBERS = ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit'];

    public function __construct(#[Autowire('%kernel.secret%')] private string $secret) {}

    public function issue(string $form, ?int $now = null): string
    {
        $payload = self::encode(json_encode(['f' => $form, 't' => $now ?? time(), 'n' => bin2hex(random_bytes(6))], JSON_THROW_ON_ERROR));

        return $payload.'.'.$this->sign('token|'.$payload);
    }

    /** Heure d'émission du jeton s'il est authentique, destiné à ce formulaire et non expiré ; null sinon. */
    public function issuedAt(string $token, string $form, ?int $now = null): ?int
    {
        $data = $this->open($token, 'token');
        if ($data === null || ($data['f'] ?? null) !== $form || !is_int($data['t'] ?? null)) {
            return null;
        }
        $age = ($now ?? time()) - $data['t'];

        return $age >= -5 && $age <= self::TOKEN_LIFETIME ? $data['t'] : null;
    }

    /** @return array{token: string, question: string} */
    public function challenge(?int $now = null): array
    {
        $a = random_int(2, 9);
        $b = random_int(1, 9);
        $nonce = bin2hex(random_bytes(6));
        $payload = self::encode(json_encode([
            'e' => ($now ?? time()) + self::CHALLENGE_LIFETIME,
            'n' => $nonce,
            'h' => $this->sign('answer|'.$nonce.'|'.($a + $b)),
        ], JSON_THROW_ON_ERROR));

        return [
            'token' => $payload.'.'.$this->sign('challenge|'.$payload),
            'question' => sprintf('Combien font %d + %d ? Répondez en chiffres ou en lettres.', $a, $b),
        ];
    }

    /** Vérifie la réponse à un défi (`<jeton>:<réponse>`), en acceptant « 7 », « sept » ou «  Sept  ». */
    public function solves(string $header, ?int $now = null): bool
    {
        $separator = strrpos($header, ':');
        if ($separator === false) {
            return false;
        }
        $data = $this->open(substr($header, 0, $separator), 'challenge');
        if ($data === null || !is_int($data['e'] ?? null) || $data['e'] < ($now ?? time())) {
            return false;
        }
        $answer = self::normalizeAnswer(substr($header, $separator + 1));
        if ($answer === null) {
            return false;
        }

        return hash_equals((string) ($data['h'] ?? ''), $this->sign('answer|'.($data['n'] ?? '').'|'.$answer));
    }

    private static function normalizeAnswer(string $raw): ?int
    {
        $answer = mb_strtolower(trim(rawurldecode($raw)));
        $answer = strtr($answer, ['é' => 'e', 'è' => 'e', ' ' => '-']);
        if (preg_match('/^\d{1,2}$/', $answer) === 1) {
            return (int) $answer;
        }
        $index = array_search($answer, self::NUMBERS, true);

        return $index === false ? null : (int) $index;
    }

    /** @return array<string, mixed>|null */
    private function open(string $token, string $purpose): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2 || !hash_equals($this->sign($purpose.'|'.$parts[0]), $parts[1])) {
            return null;
        }
        $json = base64_decode(strtr($parts[0], '-_', '+/'), true);
        $data = $json === false ? null : json_decode($json, true);

        return is_array($data) ? $data : null;
    }

    private function sign(string $value): string
    {
        return self::encode(hash_hmac('sha256', 'form-guard|'.$value, $this->secret, true));
    }

    private static function encode(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }
}
