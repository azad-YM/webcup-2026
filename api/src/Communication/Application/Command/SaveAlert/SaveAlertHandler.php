<?php

declare(strict_types=1);

namespace Communication\Application\Command\SaveAlert;

use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Application\Ports\Provider\DistrictDirectory;
use Communication\Application\Ports\Repository\AlertRepository;
use Communication\Domain\Entity\Alert;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'command.bus')]
final readonly class SaveAlertHandler
{
    public function __construct(
        private AlertRepository $alerts,
        private CommunicationAccessPolicy $access,
        private DistrictDirectory $districts,
        private IClock $clock,
        private IIdProvider $ids,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(SaveAlertCommand $cmd): array
    {
        if (!$this->access->canPublish()) {
            throw new AccessDeniedException('Permission de publication requise.');
        }
        if ($cmd->audience === 'district' && ($cmd->district === null || !$this->districts->exists(trim($cmd->district)))) {
            throw new DomainException('Quartier inconnu : choisissez un quartier de la liste.');
        }
        $content = [
            'title' => $cmd->title,
            'message' => $cmd->message,
            'severity' => $cmd->severity,
            'audience' => $cmd->audience,
            'district' => $cmd->district,
            'startsAt' => self::date($cmd->startsAt, 'Début de validité'),
            'endsAt' => self::date($cmd->endsAt, 'Fin de validité'),
            'recommendations' => $cmd->recommendations,
            'category' => $cmd->category,
            'signatory' => $cmd->signatory,
        ];
        $official = $cmd->category === 'official';
        if ($official && $cmd->state === 'published' && !$cmd->confirmOfficial) {
            throw new DomainException('Confirmez la publication du message officiel : il s’affichera immédiatement en haut de toutes les pages du site.');
        }
        $now = $this->clock->now();
        if ($cmd->id === null || $cmd->id === '') {
            $previousState = null;
            $alert = Alert::draft($this->ids->getId(), $content, $now);
            $alert->moveTo($cmd->state, $now);
        } else {
            $alert = $this->alerts->find($cmd->id) ?? throw new NotFoundException('Alerte introuvable.');
            $previousState = $alert->managementView()['state'] ?? null;
            [$previousAudience, $previousDistrict] = [$alert->audience(), $alert->district()];
            $alert->revise($content, $now);
            $alert->moveTo($cmd->state, $now, $previousAudience, $previousDistrict);
        }
        $this->alerts->save($alert);
        $view = $alert->managementView();
        $labels = ['draft' => 'brouillon', 'published' => 'publiée', 'withdrawn' => 'retirée'];
        $resource = $official ? 'official-message' : 'alert';
        $this->audit?->record(
            match (true) {
                $cmd->state === 'published' && $previousState !== 'published' => "communication.$resource.published",
                $cmd->state === 'withdrawn' && $previousState !== 'withdrawn' => "communication.$resource.withdrawn",
                $previousState === null => "communication.$resource.created",
                default => "communication.$resource.updated",
            },
            $resource,
            $alert->id,
            sprintf($official ? 'Message officiel « %s » (signé %s) : %s.' : 'Alerte « %s » (%s) : %s.', $cmd->title, $official ? (string) $cmd->signatory : $cmd->severity, $labels[$cmd->state] ?? $cmd->state),
            ['previousState' => $previousState, 'state' => $cmd->state, 'severity' => $cmd->severity, 'audience' => $cmd->audience, 'district' => $cmd->district, 'category' => $cmd->category],
        );

        return $view;
    }

    private static function date(string $value, string $label): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            throw new DomainException(sprintf('%s : date invalide.', $label));
        }
    }
}
