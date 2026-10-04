<?php

declare(strict_types=1);

namespace Citizen\Application\Command\RaiseConcern;

use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\ViewModel\ConcernView;
use Citizen\Domain\Entity\Concern;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F51 : la réponse est l'accusé de réception (référence INQ-…, date, étape « reçue »). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class RaiseConcernHandler
{
    public function __construct(
        private CitizenRepository $citizens,
        private CurrentAccountProvider $identity,
        private ConcernRepository $concerns,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    public function __invoke(RaiseConcernCommand $cmd): ConcernView
    {
        $citizen = $this->citizens->findByUserId($this->identity->userId())
            ?? throw new NotFoundException('The current account is not a citizen.');
        $concern = Concern::raise($this->ids->getId(), $citizen->id, $cmd->topic, $cmd->subject, $cmd->message, $this->clock->now());
        $this->concerns->save($concern);

        return ConcernView::from($concern);
    }
}
