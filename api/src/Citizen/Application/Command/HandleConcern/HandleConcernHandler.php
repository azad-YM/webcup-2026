<?php

declare(strict_types=1);

namespace Citizen\Application\Command\HandleConcern;

use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\ViewModel\ConcernView;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class HandleConcernHandler
{
    public function __construct(private RequestAccessPolicy $access, private ConcernRepository $concerns, private IClock $clock) {}

    public function __invoke(HandleConcernCommand $cmd): ConcernView
    {
        if (!$this->access->canProcessRequests()) {
            throw new AccessDeniedException('Handling concerns requires the admin.request.write permission.');
        }
        $concern = $this->concerns->find($cmd->concernId) ?? throw new NotFoundException('Concern not found.');
        $concern->handle($cmd->status, $cmd->comment, $this->clock->now());
        $this->concerns->save($concern);

        return ConcernView::from($concern);
    }
}
