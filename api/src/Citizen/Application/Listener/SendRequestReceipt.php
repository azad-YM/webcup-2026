<?php

declare(strict_types=1);

namespace Citizen\Application\Listener;

use Citizen\Application\Command\RecordCitizenNotification\RecordCitizenNotificationCommand;
use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\Ports\Service\RequestReceiptMailer;
use Citizen\Application\Service\RequestReceipts;
use Citizen\Domain\Entity\CitizenNotification;
use Citizen\Domain\Event\ServiceRequestSubmitted;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * F83 / F86 : après l'envoi d'une demande (worker), l'accusé de réception part par e-mail si le compte en a un ;
 * une urgence médicale reçoit en plus une notification qui rappelle le 15 et le 112.
 * Un échec d'envoi d'e-mail est journalisé sans bloquer : l'accusé reste disponible dans « Mes demandes ».
 */
final readonly class SendRequestReceipt
{
    public function __construct(
        private ServiceRequestRepository $requests,
        private CitizenRepository $citizens,
        private CitizenAccountManager $accounts,
        private RequestReceipts $receipts,
        private RequestReceiptMailer $mailer,
        private MessageBusInterface $commandBus,
        private ?LoggerInterface $logger = null,
    ) {}

    #[AsMessageHandler(bus: 'event.bus')]
    public function __invoke(ServiceRequestSubmitted $event): void
    {
        if ($event->medicalEmergency) {
            $this->commandBus->dispatch(new RecordCitizenNotificationCommand(
                $event->citizenId,
                CitizenNotification::KIND_REQUEST_EMERGENCY,
                sprintf('request:%s:emergency', $event->requestId),
                sprintf('Urgence médicale %s : appelez le 15 ou le 112', $event->reference),
                'Votre demande a été transmise en priorité aux agents de la mairie. Cette plateforme n’est pas un service d’urgence : si une vie est en danger, appelez immédiatement le 15 (SAMU) ou le 112.',
                '/urgences',
            ));
        }
        $request = $this->requests->findById($event->requestId);
        $citizen = $this->citizens->findById($event->citizenId);
        if ($request === null || $citizen === null) {
            return;
        }
        $email = $this->accounts->emails([$citizen->userId])[$citizen->userId] ?? null;
        if ($email === null || $email === '') {
            return;
        }
        try {
            $this->mailer->send($email, $this->receipts->receipt($request));
        } catch (\Throwable $error) {
            $this->logger?->warning('Request receipt e-mail not sent.', ['reference' => $event->reference, 'error' => $error::class]);
        }
    }
}
