<?php

declare(strict_types=1);

namespace IAM\Application\Service;

/**
 * Refus contractuel d'une étape de connexion ou de confirmation d'identité (L15).
 *
 * Ces refus doivent **valider** la transaction du command.bus : un essai de code manqué, un lien refusé ou une
 * demande comptée par le limiteur restent enregistrés. Le handler retourne donc ce tableau au lieu de lever une
 * exception (qui annulerait la transaction) ; le contrôleur le traduit en réponse HTTP (`RendersOutcome`).
 */
final class Outcome
{
    public const STATUS_KEY = 'httpStatus';

    /** @param array<string, mixed> $extra */
    public static function failure(int $status, string $code, string $message, array $extra = []): array
    {
        return [self::STATUS_KEY => $status, 'code' => $code, 'error' => $message, ...$extra];
    }

    public static function suspended(): array
    {
        return self::failure(403, 'account_suspended', 'Votre compte est suspendu par la mairie. Contactez l’accueil de la mairie pour en connaître la raison.');
    }

    /** Résultat de `IdentityReconfirmation::verify()` traduit en refus ; null si l'identité est confirmée. */
    public static function fromReconfirmation(string $result, int $remainingAttempts = 0): ?array
    {
        return match ($result) {
            IdentityReconfirmation::OK => null,
            IdentityReconfirmation::INVALID_PASSWORD => self::failure(403, 'invalid_password', 'Mot de passe incorrect.'),
            IdentityReconfirmation::INVALID_CODE => self::failure(422, 'invalid_code', sprintf('Code incorrect. Il vous reste %d essai%s.', $remainingAttempts, $remainingAttempts > 1 ? 's' : ''), ['remainingAttempts' => $remainingAttempts]),
            IdentityReconfirmation::LOCKED => self::failure(429, 'too_many_attempts', 'Trop d’essais avec ce code. Demandez un nouveau code.'),
            IdentityReconfirmation::EXPIRED => self::failure(410, 'code_expired', 'Ce code n’est plus valable (10 minutes). Demandez un nouveau code.'),
            default => self::failure(422, 'reconfirmation_required', 'Confirmez votre identité avec votre mot de passe ou avec le code reçu par e-mail.'),
        };
    }
}
