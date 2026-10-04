<?php

declare(strict_types=1);

namespace IAM\Application\Query\GetMyProfile;
use IAM\Application\Ports\Service\IAuthenticatedUserProvider;
use IAM\Application\Ports\Repository\IUserRepository;
use IAM\Application\Query\ListMySpaces\ListMySpacesHandler;
use IAM\Application\Query\ListMySpaces\ListMySpacesQuery;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus: 'query.bus')]
final readonly class GetMyProfileHandler
{
    public function __construct(private IAuthenticatedUserProvider $identity, private IUserRepository $users, private ListMySpacesHandler $spaces) {}
    public function __invoke(GetMyProfileQuery $query): array
    {
        $identity = $this->identity->getUser();
        $user = $this->users->findByEmail($identity->getEmail());
        return [
            'email' => $user !== null && !$user->hasRealEmail() ? '' : $identity->getEmail(),
            'name' => $user?->getName() ?? '',
            'spaces' => ($this->spaces)(new ListMySpacesQuery()),
            // F71 : compte créé à l’accueil (identifiant d’habitant) ; code provisoire à remplacer.
            'residentId' => $user?->residentId(),
            'passwordChangeRequired' => $user?->passwordChangeRequired() ?? false,
        ];
    }
}
