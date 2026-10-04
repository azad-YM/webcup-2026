<?php

declare(strict_types=1);

namespace Participation\Application\Command\FollowIdea;

use Participation\Application\DTO\CitizenNotice;
use Participation\Application\Ports\Provider\CitizenNotifier;
use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\IdeaRepository;
use Participation\Application\Support\IdeaLabels;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Each change of status is journaled and notified to the author in their space (Citizen notifications). */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class FollowIdeaHandler
{
    public function __construct(
        private IdeaRepository $ideas,
        private ParticipationAccessPolicy $access,
        private CitizenNotifier $notifier,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(FollowIdeaCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $idea = $this->ideas->find($cmd->ideaId) ?? throw new NotFoundException('Idée introuvable.');
        $previous = $idea->status();
        $idea->follow($cmd->status, $cmd->comment, $this->clock->now());
        $this->ideas->save($idea);

        $label = IdeaLabels::STATUS[$cmd->status];
        $this->audit?->record(
            'participation.idea.status_changed',
            'idea',
            $idea->id,
            sprintf('Idée %s : %s.', $idea->reference, $label),
            ['from' => $previous, 'to' => $cmd->status],
        );
        $this->notifier->notify(new CitizenNotice(
            $idea->citizenId,
            sprintf('idea:%s:%s:%d', $idea->id, $cmd->status, count($idea->followUpView()['trail'])),
            sprintf('Idée %s', $idea->reference),
            sprintf('Votre idée « %s » : %s.', mb_substr($idea->title, 0, 80), $label),
            '/espace/contributions#' . $idea->reference,
        ));

        return $idea->followUpView();
    }
}
