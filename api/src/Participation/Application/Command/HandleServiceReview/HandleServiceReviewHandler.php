<?php

declare(strict_types=1);

namespace Participation\Application\Command\HandleServiceReview;

use Participation\Application\DTO\CitizenNotice;
use Participation\Application\Ports\Provider\CitizenNotifier;
use Participation\Application\Ports\Provider\ParticipationAccessPolicy;
use Participation\Application\Ports\Repository\ServiceReviewRepository;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F76 : « Lu par le service » ou « Réponse du service » ; l'habitant est prévenu d'une réponse ; journalisé. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class HandleServiceReviewHandler
{
    public function __construct(
        private ServiceReviewRepository $reviews,
        private ParticipationAccessPolicy $access,
        private CitizenNotifier $notifier,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(HandleServiceReviewCommand $cmd): array
    {
        if (!$this->access->canWrite()) {
            throw new AccessDeniedException('Permission admin.participation.write requise.');
        }
        $review = $this->reviews->find($cmd->reviewId) ?? throw new NotFoundException('Avis introuvable.');
        $now = $this->clock->now();
        if ($cmd->action === 'read') {
            $review->markRead($now);
        } else {
            $review->respond((string) $cmd->response, $now);
        }
        $this->reviews->save($review);
        $this->audit?->record(
            $cmd->action === 'read' ? 'participation.service-review.read' : 'participation.service-review.answered',
            'service-review',
            $review->id,
            sprintf($cmd->action === 'read' ? 'Avis %s sur « %s » marqué comme lu.' : 'Réponse à l’avis %s sur « %s ».', $review->reference, $review->serviceName()),
            ['rating' => $review->rating()],
        );
        if ($cmd->action === 'respond') {
            $this->notifier->notify(new CitizenNotice(
                $review->citizenId,
                sprintf('service-review:%s:%s', $review->id, $now->format('YmdHis')),
                sprintf('Avis %s', $review->reference),
                sprintf('Le service « %s » a répondu à votre avis.', mb_substr($review->serviceName(), 0, 80)),
                '/espace/contributions#' . $review->reference,
            ));
        }

        return $review->followUpView();
    }
}
