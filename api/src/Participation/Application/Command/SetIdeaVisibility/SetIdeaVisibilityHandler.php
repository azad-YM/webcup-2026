<?php

declare(strict_types=1);

namespace Participation\Application\Command\SetIdeaVisibility;

use Participation\Application\DTO\CitizenNotice;
use Participation\Application\Ports\Provider\CitizenNotifier;
use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\IdeaRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SetIdeaVisibilityHandler
{
    public function __construct(
        private IdeaRepository $ideas,
        private ParticipationAccessPolicy $access,
        private CitizenNotifier $notifier,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SetIdeaVisibilityCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $idea = $this->ideas->find($cmd->ideaId) ?? throw new NotFoundException('Idée introuvable.');
        $now = $this->clock->now();
        $idea->setPublic($cmd->public, $cmd->reason, $now);
        $this->ideas->save($idea);

        $this->audit?->record(
            $cmd->public ? 'participation.idea.published' : 'participation.idea.hidden',
            'idea',
            $idea->id,
            $cmd->public ? sprintf('Idée %s de nouveau publique.', $idea->reference) : sprintf('Idée %s retirée de la liste publique.', $idea->reference),
            ['reason' => $idea->hiddenReason()],
        );
        $this->notifier->notify(new CitizenNotice(
            $idea->citizenId,
            sprintf('idea:%s:%s:%s', $idea->id, $cmd->public ? 'public' : 'hidden', $now->format('YmdHis')),
            sprintf('Idée %s', $idea->reference),
            $cmd->public
                ? sprintf('Votre idée « %s » est de nouveau visible par les habitants.', mb_substr($idea->title, 0, 80))
                : sprintf('Votre idée « %s » n’est pas publiée. Motif : %s', mb_substr($idea->title, 0, 80), mb_substr((string) $idea->hiddenReason(), 0, 300)),
            '/espace/contributions#' . $idea->reference,
        ));

        return $idea->followUpView();
    }
}
