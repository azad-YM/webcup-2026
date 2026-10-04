<?php

declare(strict_types=1);

namespace Participation\Application\Command\RecordConsultationOutcome;

use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ConsultationRepository;
use Participation\Application\Ports\Repository\ContributionRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class RecordConsultationOutcomeHandler
{
    public function __construct(
        private ConsultationRepository $consultations,
        private ContributionRepository $contributions,
        private ParticipationAccessPolicy $access,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(RecordConsultationOutcomeCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $consultation = $this->consultations->find($cmd->consultationId) ?? throw new NotFoundException('Consultation introuvable.');
        $now = $this->clock->now();
        $consultation->recordOutcome($cmd->outcome, $now);
        $this->consultations->save($consultation);
        $this->audit?->record(
            'participation.consultation.outcome_recorded',
            'consultation',
            $consultation->id,
            sprintf('Compte rendu « Ce que la ville en a retenu » de « %s » enregistré.', $consultation->title()),
            ['paragraphs' => count($cmd->outcome)],
        );

        return $consultation->managementView($now, $this->contributions->tally([$consultation->id])[$consultation->id]);
    }
}
