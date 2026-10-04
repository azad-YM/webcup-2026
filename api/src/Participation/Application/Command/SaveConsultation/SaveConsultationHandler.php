<?php

declare(strict_types=1);

namespace Participation\Application\Command\SaveConsultation;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Participation\Application\Ports\Repository\ProjectRepository;
use Participation\Application\Support\Dates;
use Participation\Domain\Entity\Consultation;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SaveConsultationHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ProjectRepository $projects,
        private ParticipationAccessPolicy $access,
        private IClock $clock,
        private IIdProvider $ids,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SaveConsultationCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $projectId = $cmd->projectId === null || trim($cmd->projectId) === '' ? null : trim($cmd->projectId);
        if ($projectId !== null && $this->projects->find($projectId) === null) {
            throw new DomainException('Projet rattaché introuvable.');
        }
        $content = [
            'projectId' => $projectId,
            'kind' => $cmd->kind,
            'title' => $cmd->title,
            'question' => $cmd->question,
            'description' => $cmd->description,
            'options' => $cmd->options,
            'opensAt' => Dates::parse($cmd->opensAt, 'Ouverture'),
            'closesAt' => Dates::parse($cmd->closesAt, 'Clôture'),
        ];
        $now = $this->clock->now();
        if ($cmd->id === null || $cmd->id === '') {
            $previousState = null;
            $consultation = Consultation::draft($this->ids->getId(), $content, $now);
        } else {
            $consultation = $this->consultations->find($cmd->id) ?? throw new NotFoundException('Consultation introuvable.');
            $previousState = $consultation->isPublished() ? 'published' : 'other';
            $consultation->revise($content, $this->contributions->countByConsultation($consultation->id) > 0, $now);
        }
        $consultation->moveTo($cmd->state, $now);
        $this->consultations->save($consultation);

        $this->audit?->record(
            match (true) {
                $cmd->state === 'published' && $previousState !== 'published' => 'participation.consultation.published',
                $cmd->state === 'withdrawn' && $previousState === 'published' => 'participation.consultation.withdrawn',
                $previousState === null => 'participation.consultation.created',
                default => 'participation.consultation.updated',
            },
            'consultation',
            $consultation->id,
            sprintf('%s « %s » enregistrée (%s).', $cmd->kind === 'opinion' ? 'Demande d’avis' : 'Consultation', $consultation->title(), $cmd->state),
            ['kind' => $cmd->kind, 'state' => $cmd->state, 'projectId' => $projectId],
        );

        return $consultation->managementView($now, $this->contributions->tally([$consultation->id])[$consultation->id]);
    }
}
