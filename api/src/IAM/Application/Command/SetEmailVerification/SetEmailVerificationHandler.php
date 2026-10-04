<?php

declare(strict_types=1);

namespace IAM\Application\Command\SetEmailVerification;

use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Service\CurrentAccount;
use IAM\Application\Service\IdentityReconfirmation;
use IAM\Application\Service\Outcome;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetEmailVerificationHandler
{
    public function __construct(private CurrentAccount $account, private IUserRepository $users, private IdentityReconfirmation $reconfirmation) {}

    /** @return array<string, mixed> */
    public function __invoke(SetEmailVerificationCommand $cmd): array
    {
        $user = $this->account->user();
        if ($cmd->enabled && $user->contactEmail() === null) {
            return Outcome::failure(422, 'email_unavailable', 'La vérification par e-mail demande une adresse e-mail. Ce compte n’en a pas : adressez-vous à l’accueil de la mairie.');
        }
        // L'activation exige le code : il prouve que les messages arrivent bien avant de les rendre obligatoires.
        $password = $cmd->enabled ? null : $cmd->password;
        [$result, $left] = $this->reconfirmation->verify($user, $password, $cmd->challengeId, $cmd->code);
        $refusal = Outcome::fromReconfirmation($result, $left);
        if ($refusal !== null) {
            return $refusal;
        }
        $cmd->enabled ? $user->enableEmailVerification() : $user->disableEmailVerification();
        $this->users->save($user);

        return ['emailVerificationEnabled' => $user->emailVerificationEnabled()];
    }
}
