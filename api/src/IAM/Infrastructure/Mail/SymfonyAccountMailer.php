<?php

declare(strict_types=1);

namespace IAM\Infrastructure\Mail;

use IAM\Application\Ports\Service\AccountMailer;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * E-mails de sécurité en texte clair, via le Mailer Symfony (`MAILER_DSN`, Mailpit en développement).
 * L'envoi passe par Messenger (`SendEmailMessage` routé vers `async`) : il part après la validation de la
 * transaction et la durée de la requête ne dépend pas de l'existence du compte.
 */
final readonly class SymfonyAccountMailer implements AccountMailer
{
    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(SITE_URL)%')] private string $siteUrl,
        #[Autowire('%env(MAILER_FROM)%')] private string $from,
    ) {}

    public function sendLoginLink(string $to, string $token, int $minutes): void
    {
        $url = rtrim($this->siteUrl, '/').'/connexion/lien?jeton='.$token;
        $this->send($to, 'Votre lien de connexion à Nova Terra', <<<TEXT
            Bonjour,

            Vous avez demandé à vous connecter à votre espace Nova Terra sans mot de passe.
            Ouvrez ce lien pour vous connecter :

            {$url}

            Important :
            - ce lien est valable {$minutes} minutes et ne sert qu'une seule fois ;
            - ouvrez-le sur le même appareil et dans le même navigateur que ceux utilisés pour la demande ;
            - ne le transférez à personne : les agents de la mairie ne vous le demanderont jamais.

            Vous n'avez rien demandé ? Ignorez ce message : sans ce navigateur, le lien ne permet pas d'entrer
            dans votre compte.

            La mairie de Nova Terra
            TEXT);
    }

    public function sendVerificationCode(string $to, string $code, string $purpose, int $minutes): void
    {
        $reason = $purpose === 'sign_in'
            ? 'Une connexion à votre compte Nova Terra est en cours. Pour la terminer, saisissez ce code :'
            : 'Vous confirmez votre identité dans votre espace Nova Terra. Saisissez ce code :';
        $this->send($to, sprintf('Votre code Nova Terra : %s', $code), <<<TEXT
            Bonjour,

            {$reason}

                {$code}

            Ce code est valable {$minutes} minutes. Ne le communiquez à personne, même à un agent de la mairie.

            Ce n'est pas vous ? Votre mot de passe est peut-être connu de quelqu'un d'autre : connectez-vous et
            changez-le depuis « Sécurité du compte », ou contactez l'accueil de la mairie.

            La mairie de Nova Terra
            TEXT);
    }

    public function sendNewDeviceAlert(string $to, string $deviceLabel, \DateTimeImmutable $at): void
    {
        $when = $at->setTimezone(new \DateTimeZone('Indian/Reunion'))->format('d/m/Y à H:i').' (heure de La Réunion)';
        $url = rtrim($this->siteUrl, '/').'/espace/securite';
        $this->send($to, 'Nouvelle connexion à votre compte Nova Terra', <<<TEXT
            Bonjour,

            Votre compte Nova Terra vient d'être utilisé depuis un appareil que nous ne connaissions pas :

            - appareil : {$deviceLabel}
            - date : le {$when}

            C'est vous ? Vous n'avez rien à faire.

            Ce n'est pas vous ? Ouvrez « Sécurité du compte », choisissez « Ce n'était pas moi » sur cet appareil :
            toutes les sessions seront fermées. Changez ensuite votre mot de passe.
            {$url}

            La mairie de Nova Terra
            TEXT);
    }

    private function send(string $to, string $subject, string $text): void
    {
        $this->mailer->send((new Email())->from($this->from)->to($to)->subject($subject)->text($text));
    }
}
