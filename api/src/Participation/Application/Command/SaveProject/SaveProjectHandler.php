<?php

declare(strict_types=1);

namespace Participation\Application\Command\SaveProject;

use Participation\Application\Ports\Provider\DistrictDirectory;
use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Domain\Entity\Project;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SaveProjectHandler
{
    public function __construct(
        private ProjectRepository $projects,
        private ParticipationAccessPolicy $access,
        private DistrictDirectory $districts,
        private IClock $clock,
        private IIdProvider $ids,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SaveProjectCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $district = $cmd->district === null || trim($cmd->district) === '' ? null : trim($cmd->district);
        if ($district !== null && !$this->districts->exists($district)) {
            throw new DomainException('Quartier inconnu : choisissez un quartier de la liste, ou « toute la ville ».');
        }
        $content = [
            'title' => $cmd->title,
            'summary' => $cmd->summary,
            'description' => $cmd->description,
            'district' => $district,
            'status' => $cmd->status,
            'steps' => $cmd->steps,
            'nextStep' => $cmd->nextStep,
        ];
        $now = $this->clock->now();
        if ($cmd->id === null || $cmd->id === '') {
            $previousState = null;
            $project = Project::draft($this->ids->getId(), $content, $now);
        } else {
            $project = $this->projects->find($cmd->id) ?? throw new NotFoundException('Projet introuvable.');
            $previousState = $project->state();
            $project->revise($content, $now);
        }
        $project->moveTo($cmd->state, $now);
        $this->projects->save($project);

        $labels = ['draft' => 'brouillon', 'published' => 'publié', 'withdrawn' => 'retiré'];
        $this->audit?->record(
            match (true) {
                $cmd->state === 'published' && $previousState !== 'published' => 'participation.project.published',
                $cmd->state === 'withdrawn' && $previousState !== 'withdrawn' => 'participation.project.withdrawn',
                $previousState === null => 'participation.project.created',
                default => 'participation.project.updated',
            },
            'project',
            $project->id,
            sprintf('Projet « %s » : %s.', $project->title(), $labels[$cmd->state] ?? $cmd->state),
            ['previousState' => $previousState, 'state' => $cmd->state, 'status' => $cmd->status],
        );

        return $project->managementView();
    }
}
