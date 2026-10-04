<?php

declare(strict_types=1);

namespace Citizen\Application\Command\ExportMyPersonalData;

use Citizen\Application\Ports\Provider\AccountReconfirmation;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\PersonalAccountDataProvider;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Application\Ports\Repository\AppointmentRepository;
use Citizen\Application\Ports\Repository\CitizenNotificationRepository;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Repository\ConcernRepository;
use Citizen\Application\Ports\Repository\RequestSupportRepository;
use Citizen\Application\Ports\Repository\ServiceRequestRepository;
use Citizen\Application\ViewModel\AppointmentViews;
use Citizen\Application\ViewModel\CitizenNotificationView;
use Citizen\Application\ViewModel\CitizenProfile;
use Citizen\Application\ViewModel\ConcernView;
use Citizen\Application\ViewModel\ServiceRequestView;
use Shared\Application\Ports\Service\AuditTrail;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\NotFoundException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * F55 : rassemble ce que la ville sait du citoyen connecté, rubrique par rubrique, avec l'explication de chacune.
 * Citizen orchestre ; les données du compte de connexion viennent d'IAM par le port `PersonalAccountDataProvider`.
 * Format documenté dans doc/mes-donnees.md (`nova-terra.donnees-personnelles`, version 1).
 *
 * Un refus de confirmation est **retourné** (clé `httpStatus`), pas levé : l'essai de code manqué doit rester compté.
 */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class ExportMyPersonalDataHandler
{
    public const FORMAT = 'nova-terra.donnees-personnelles';
    public const VERSION = 1;
    public const NOTIFICATIONS = 500;

    public function __construct(
        private CurrentAccountProvider $identity,
        private CitizenRepository $citizens,
        private PersonalAccountDataProvider $accounts,
        private AlertPreferenceRepository $preferences,
        private ServiceRequestRepository $requests,
        private AppointmentRepository $appointments,
        private CitizenNotificationRepository $notifications,
        private ConcernRepository $concerns,
        private RequestSupportRepository $supports,
        private IClock $clock,
        private ?AuditTrail $audit = null,
    ) {}

    /** @return array<string, mixed> */
    public function __invoke(ExportMyPersonalDataCommand $cmd): array
    {
        $userId = $this->identity->userId();
        $citizen = $this->citizens->findByUserId($userId) ?? throw new NotFoundException('The current account is not a citizen.');
        $confirmation = $this->accounts->reconfirm($userId, $cmd->password, $cmd->challengeId, $cmd->code);
        if (!$confirmation->confirmed()) {
            return self::refusal($confirmation);
        }

        $now = $this->clock->now();
        $account = $this->accounts->accountData($userId);
        $preference = $this->preferences->get($citizen->id);
        $requests = $this->requests->findByCitizen($citizen->id);
        $counts = $this->supports->countByRequests(array_map(static fn ($request) => $request->id, $requests));
        $supports = [];
        foreach ($this->supports->findByCitizen($citizen->id) as $support) {
            $request = $this->requests->findById($support->requestId);
            $supports[] = [
                'reference' => $request?->reference,
                'subject' => $request?->subject,
                'supportedAt' => $support->createdAt->format(DATE_ATOM),
            ];
        }

        $sections = [
            self::section('compte', 'Compte de connexion', 'L’adresse e-mail et le nom de votre compte, son état et la vérification supplémentaire. Votre mot de passe n’est jamais exporté : la ville n’en garde qu’une empreinte illisible.', $account->account),
            self::section('profil', 'Profil citoyen', 'Les informations que vous avez renseignées dans « Mon profil ». Elles sont facultatives et modifiables à tout moment.', CitizenProfile::fromCitizen($citizen)),
            self::section('preferences', 'Préférences d’alerte', 'Votre quartier, utilisé pour les alertes qui le concernent, et votre accord pour recevoir les alertes sanitaires. Aucune donnée de santé n’est enregistrée.', ['district' => $citizen->district(), 'healthConsent' => $preference->healthConsent()]),
            self::section('demandes', 'Demandes et signalements', 'Vos messages à la mairie et vos signalements, avec leur numéro de suivi, leur état et chaque étape de leur traitement.', array_map(static fn ($request) => ServiceRequestView::fromRequest($request, $counts[$request->id] ?? 0), $requests)),
            self::section('rendez-vous', 'Rendez-vous', 'Les rendez-vous pris avec les services municipaux, y compris ceux annulés.', array_map(static fn ($appointment) => AppointmentViews::appointment($appointment, $now), $this->appointments->findByCitizen($citizen->id))),
            self::section('notifications', 'Notifications', sprintf('Les messages reçus dans votre espace (%d plus récents au plus) et la date à laquelle vous les avez lus.', self::NOTIFICATIONS), array_map(static fn ($notification) => CitizenNotificationView::from($notification), $this->notifications->findByCitizen($citizen->id, self::NOTIFICATIONS))),
            self::section('participation', 'Participation', 'Les inquiétudes que vous avez fait remonter à la mairie avec ses réponses, et les signalements de vos voisins que vous avez soutenus.', [
                'concerns' => array_map(static fn ($concern) => ConcernView::from($concern), $this->concerns->findByCitizen($citizen->id)),
                'supports' => $supports,
            ]),
            self::section('appareils', 'Appareils reconnus', 'Les navigateurs depuis lesquels vous vous êtes connecté. Ils servent à vous prévenir d’une connexion depuis un nouvel appareil et, si vous l’avez choisi, à ne pas redemander le code pendant 30 jours.', $account->devices),
            self::section('connexions', 'Connexions récentes', 'Vos dernières connexions (90 jours au plus) : date, méthode (mot de passe ou lien reçu par e-mail), appareil et adresse IP. Elles servent à la sécurité de votre compte.', $account->signIns),
        ];

        $this->audit?->record('citizen.personal-data.exported', 'citizen-account', $citizen->id, 'Export de ses données personnelles par le citoyen.', ['sections' => count($sections)]);

        return [
            'format' => self::FORMAT,
            'version' => self::VERSION,
            'generatedAt' => $now->format(DATE_ATOM),
            'controller' => 'Mairie de Nova Terra',
            'sections' => $sections,
        ];
    }

    /** @return array<string, mixed> */
    private static function section(string $key, string $title, string $explanation, mixed $data): array
    {
        return ['key' => $key, 'title' => $title, 'explanation' => $explanation, 'data' => $data];
    }

    /** @return array<string, mixed> */
    private static function refusal(AccountReconfirmation $confirmation): array
    {
        $left = $confirmation->remainingAttempts;
        [$status, $message] = match ($confirmation->result) {
            AccountReconfirmation::INVALID_PASSWORD => [403, 'Mot de passe incorrect.'],
            AccountReconfirmation::INVALID_CODE => [422, sprintf('Code incorrect. Il vous reste %d essai%s.', $left, $left > 1 ? 's' : '')],
            AccountReconfirmation::TOO_MANY_ATTEMPTS => [429, 'Trop d’essais avec ce code. Demandez un nouveau code.'],
            AccountReconfirmation::CODE_EXPIRED => [410, 'Ce code n’est plus valable (10 minutes). Demandez un nouveau code.'],
            default => [422, 'Confirmez votre identité avec votre mot de passe ou avec le code reçu par e-mail.'],
        };

        return ['httpStatus' => $status, 'code' => $confirmation->result, 'error' => $message, 'remainingAttempts' => $left];
    }
}
