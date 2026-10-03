<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListMyConcerns;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\ViewModel\ConcernView;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListMyConcernsHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ConcernRepository $concerns,
    ) {}

    /** @return array{items: list<ConcernView>} */
    public function __invoke(ListMyConcernsQuery $query): array
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');

        return ['items' => array_map(ConcernView::from(...), $this->concerns->findByCitizen($citizen->id))];
    }
}
