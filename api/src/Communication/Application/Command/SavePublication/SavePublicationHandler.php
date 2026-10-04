<?php

declare(strict_types=1);

namespace Communication\Application\Command\SavePublication;

use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Domain\Entity\Publication;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SavePublicationHandler
{
    public function __construct(
        private PublicationRepository $publications,
        private CommunicationAccessPolicy $access,
        private IClock $clock,
        private IIdProvider $ids,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SavePublicationCommand $cmd): array
    {
        if (!$this->access->canPublish()) {
            throw new AccessDeniedException('Permission de publication requise.');
        }
        $now = $this->clock->now();
        if ($cmd->id === null || $cmd->id === '') {
            $previousState = null;
            $publication = Publication::draft($this->ids->getId(), $cmd->title, $cmd->category, $cmd->summary, $cmd->body, $cmd->important, $now, $cmd->plainLanguage);
        } else {
            $publication = $this->publications->find($cmd->id) ?? throw new NotFoundException('Publication introuvable.');
            $previousState = $publication->managementView()['state'] ?? null;
            $publication->revise($cmd->title, $cmd->category, $cmd->summary, $cmd->body, $cmd->important, $now, $cmd->plainLanguage);
        }
        $publication->moveTo($cmd->state, $now);
        $this->publications->save($publication);
        $view = $publication->managementView();
        $labels = ['draft' => 'brouillon', 'published' => 'publiée', 'withdrawn' => 'retirée'];
        $this->audit?->record(
            match (true) {
                $cmd->state === 'published' && $previousState !== 'published' => 'communication.publication.published',
                $cmd->state === 'withdrawn' && $previousState !== 'withdrawn' => 'communication.publication.withdrawn',
                $previousState === null => 'communication.publication.created',
                default => 'communication.publication.updated',
            },
            'publication',
            $publication->id,
            sprintf('Publication « %s » : %s.', $cmd->title, $labels[$cmd->state] ?? $cmd->state),
            ['previousState' => $previousState, 'state' => $cmd->state, 'important' => $cmd->important],
        );

        return $view;
    }
}
