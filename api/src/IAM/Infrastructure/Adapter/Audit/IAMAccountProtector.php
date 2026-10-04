<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Adapter\Audit;

use Audit\Application\DTO\Security\ProtectionResult;
use Audit\Application\Ports\Provider\AccountProtector;
use IAM\Application\Ports\Provider\AccountSecurityNotifier;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Ports\Service\LoginAttemptLimiter;
use Shared\Application\Ports\Service\IClock;

/**
 * Port d'Audit (F85) implémenté par IAM avec ses protections existantes : verrouillage du compte (F37,
 * `LoginAttemptLimiter`), code par e-mail exigé à la prochaine connexion (F53, `User::requireCodeUntil`),
 * avertissement du titulaire dans son espace citoyen (F54, `AccountSecurityNotifier`). Appelé dans la transaction
 * du `command.bus` de l'analyse.
 */
final readonly class IAMAccountProtector implements AccountProtector
{
    public function __construct(
        private IUserRepository $users,
        private LoginAttemptLimiter $limiter,
        private AccountSecurityNotifier $notifier,
        private IClock $clock,
    ) {}

    public function protect(string $accountId, int $lockSeconds, int $codeRequiredHours, string $reason): ProtectionResult
    {
        $user = $this->users->findById($accountId);
        if ($user === null || !$user->isActive()) {
            return new ProtectionResult(false, 0, false, false, 'Compte introuvable ou déjà suspendu : aucune protection appliquée.');
        }
        $now = $this->clock->now();
        $email = $user->contactEmail();
        $lockedMinutes = 0;
        if ($lockSeconds > 0 && $email !== null) {
            $this->limiter->lockAccount($email, $lockSeconds);
            $lockedMinutes = (int) ceil($lockSeconds / 60);
        }
        $codeRequired = false;
        if ($codeRequiredHours > 0 && $email !== null) {
            $user->requireCodeUntil($now->modify(sprintf('+%d hours', $codeRequiredHours)));
            $this->users->save($user);
            $codeRequired = true;
        }
        $this->notifier->unusualActivity(
            $accountId,
            $now->format('Ymd'),
            sprintf(
                'Nous avons repéré une activité inhabituelle sur votre compte (%s). Pour vous protéger%s%s. Si vous n’êtes pas à l’origine de ces connexions, changez votre mot de passe depuis « Sécurité du compte ».',
                mb_strtolower($reason),
                $lockedMinutes > 0 ? sprintf(', les connexions sont bloquées %d minutes', $lockedMinutes) : '',
                $codeRequired ? sprintf('%s un code envoyé par e-mail sera demandé à chaque connexion pendant %d heures', $lockedMinutes > 0 ? ' et' : ',', $codeRequiredHours) : '',
            ),
            $now,
        );
        $parts = [];
        if ($lockedMinutes > 0) {
            $parts[] = sprintf('connexions verrouillées %d min', $lockedMinutes);
        }
        if ($codeRequired) {
            $parts[] = sprintf('code par e-mail exigé %d h', $codeRequiredHours);
        }
        $parts[] = 'titulaire prévenu dans son espace';

        return new ProtectionResult(true, $lockedMinutes, $codeRequired, true, ucfirst(implode(', ', $parts)).'.');
    }
}
