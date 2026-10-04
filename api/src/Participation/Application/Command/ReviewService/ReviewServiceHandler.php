<?php

declare(strict_types=1);

namespace Participation\Application\Command\ReviewService;

use Participation\Application\Ports\Provider\ParticipantProvider;
use Participation\Application\Ports\Provider\ReviewedServiceDirectory;
use Participation\Application\Ports\Repository\ServiceReviewRepository;
use Participation\Domain\Entity\ServiceReview;
use Shared\Application\Ports\Service\IClock;
use Shared\Application\Ports\Service\IIdProvider;
use Shared\Domain\Exception\DomainException;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** F76 : un avis par habitant, par service et par mois ; un nouvel envoi dans le même mois modifie l'avis existant. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ReviewServiceHandler
{
    public function __construct(
        private ParticipantProvider $participants,
        private ReviewedServiceDirectory $services,
        private ServiceReviewRepository $reviews,
        private IIdProvider $ids,
        private IClock $clock,
    ) {}

    /** @return array<string, mixed> accusé de réception (numéro, date, statut) */
    public function __invoke(ReviewServiceCommand $cmd): array
    {
        $participant = $this->participants->current() ?? throw new NotFoundException('Le compte connecté n’est pas un compte citoyen.');
        $serviceId = trim($cmd->serviceId);
        $name = $this->services->nameOf($serviceId) ?? throw new DomainException('Ce service n’existe pas dans le catalogue de la ville.');
        $now = $this->clock->now();
        $review = $this->reviews->findForPeriod($participant->citizenId, $serviceId, ServiceReview::periodOf($now));
        $updated = $review !== null;
        if ($review === null) {
            $review = ServiceReview::give($this->ids->getId(), $participant->citizenId, $serviceId, $name, $cmd->rating, $cmd->needMet, $cmd->comment, $cmd->context, $cmd->contextReference, $now);
        } else {
            $review->revise($name, $cmd->rating, $cmd->needMet, $cmd->comment, $cmd->context, $cmd->contextReference, $now);
        }
        $this->reviews->save($review);

        return $review->followUpView() + ['updated' => $updated];
    }
}
