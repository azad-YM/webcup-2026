<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListCitizenAccounts;

use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\ViewModel\CitizenProfile;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListCitizenAccountsHandler
{
    public function __construct(private CitizenRepository $citizens, private CitizenAccountManager $accounts, private CitizenAccountAccessPolicy $access) {}
    public function __invoke(ListCitizenAccountsQuery $query): array
    {
        $canManage = $this->access->canManageAccounts();
        if (!$this->access->canReadAccounts() && !$canManage) throw new AccessDeniedException('Citizen account reading is not allowed.');
        $items = [];
        foreach ($this->citizens->findAccounts() as $citizen) {
            $items[] = ['profile' => CitizenProfile::fromCitizen($citizen), 'email' => $this->accounts->email($citizen->userId), 'status' => $citizen->status(), 'canSuspend' => $canManage && !$this->access->isProtectedAccount($citizen->userId)];
        }
        return ['items' => $items, 'canManage' => $canManage];
    }
}
