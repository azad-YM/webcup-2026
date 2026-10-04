<?php

declare(strict_types=1);

namespace Citizen\Infrastructure\Mail;

use Citizen\Application\Ports\Service\RequestReceiptMailer;
use Citizen\Application\ViewModel\RequestReceiptView;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * F83 : accusé de réception en texte clair. `SendEmailMessage` est routé vers `async` : l'envoi part du worker.
 * Le message reprend la référence, la date, le service, l'objet et l'empreinte ; jamais la description.
 */
final readonly class SymfonyRequestReceiptMailer implements RequestReceiptMailer
{
    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(SITE_URL)%')] private string $siteUrl,
        #[Autowire('%env(MAILER_FROM)%')] private string $from,
    ) {}

    public function send(string $to, RequestReceiptView $receipt): void
    {
        $site = rtrim($this->siteUrl, '/');
        $when = (new \DateTimeImmutable($receipt->submittedAt))->setTimezone(new \DateTimeZone('Indian/Reunion'))->format('d/m/Y à H:i');
        $service = $receipt->serviceName ?? 'Mairie (aucun service précisé)';
        $emergency = $receipt->medicalEmergency ? <<<TEXT

            IMPORTANT — URGENCE MÉDICALE
            Cette plateforme n'est pas un service d'urgence. Si une vie est en danger, appelez
            immédiatement le 15 (SAMU) ou le 112 (numéro d'urgence européen).

            TEXT : '';
        $this->mailer->send((new Email())->from($this->from)->to($to)
            ->subject(sprintf('Accusé de réception de votre demande %s', $receipt->reference))
            ->text(<<<TEXT
                Bonjour,

                La mairie de Nova Terra a bien reçu votre demande.
                {$emergency}
                - Référence : {$receipt->reference}
                - Reçue le : {$when} (heure de La Réunion)
                - Service : {$service}
                - Objet : {$receipt->subject}
                - Empreinte de vérification : {$receipt->fingerprint}

                Conservez ce message : il prouve l'envoi de votre demande. Toute personne peut vérifier
                cet accusé, sans en voir le contenu, avec la référence et l'empreinte :
                {$site}/verifier-accuse?ref={$receipt->reference}

                Suivez votre demande dans votre espace :
                {$site}/espace/demandes?ref={$receipt->reference}

                La mairie de Nova Terra
                TEXT));
    }
}
