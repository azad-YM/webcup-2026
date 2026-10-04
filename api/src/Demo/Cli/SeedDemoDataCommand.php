<?php

declare(strict_types=1);

namespace Demo\Cli;

use Administration\Application\Command\AddMember\AddMemberCommand;
use Administration\Application\Command\CreateRole\CreateRoleCommand;
use Administration\Application\Command\SaveMunicipalService\SaveMunicipalServiceCommand;
use Administration\Application\Query\ListRoles\ListRolesQuery;
use Citizen\Application\Command\BookAppointment\BookAppointmentCommand;
use Citizen\Application\Command\ChangeRequestStatus\ChangeRequestStatusCommand;
use Citizen\Application\Command\HandleConcern\HandleConcernCommand;
use Citizen\Application\Command\LinkRequests\LinkRequestsCommand;
use Citizen\Application\Command\OpenAppointmentSlots\OpenAppointmentSlotsCommand;
use Citizen\Application\Command\RaiseConcern\RaiseConcernCommand;
use Citizen\Application\Command\RegisterCitizen\RegisterCitizenCommand;
use Citizen\Application\Command\ReplyToRequest\ReplyToRequestCommand;
use Citizen\Application\Command\SetRequestPriority\SetRequestPriorityCommand;
use Citizen\Application\Command\SubmitServiceRequest\SubmitServiceRequestCommand;
use Citizen\Application\Command\SupportRequest\SupportRequestCommand;
use Citizen\Application\Command\UpdateMyCitizenProfile\UpdateMyCitizenProfileCommand;
use Communication\Application\Command\SaveAlert\SaveAlertCommand;
use Communication\Application\Command\SavePublication\SavePublicationCommand;
use Demo\DemoDataset;
use Doctrine\DBAL\Connection;
use Participation\Application\Command\FollowIdea\FollowIdeaCommand;
use Participation\Application\Command\HandleServiceReview\HandleServiceReviewCommand;
use Participation\Application\Command\ProposeIdea\ProposeIdeaCommand;
use Participation\Application\Command\ReviewService\ReviewServiceCommand;
use Participation\Application\Command\SaveConsultation\SaveConsultationCommand;
use Participation\Application\Command\SaveProject\SaveProjectCommand;
use Participation\Application\Command\SubmitContribution\SubmitContributionCommand;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Messenger\Exception\HandlerFailedException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Charge le jeu de démonstration en jouant les vrais cas d'usage, comme le feraient les écrans :
 * chaque commande est validée puis envoyée sur `command.bus` au nom du compte concerné (administrateur,
 * agent ou citoyen). Aucun accès aux repositories, entités ou tables des modules (voir src/Demo/AGENTS.md).
 */
#[AsCommand(name: 'app:demo:seed', description: 'Charge les données de démonstration (citoyens, agents, services, demandes, publications…).')]
final class SeedDemoDataCommand extends Command
{
    private SymfonyStyle $io;
    private string $domain = 'example.com';
    private string $adminEmail = 'admin@example.com';
    /** @var array<string, string> clé du rôle => identifiant */
    private array $roleIds = [];
    /** @var list<array<string, mixed>> demandes créées, dans l'ordre du jeu */
    private array $requests = [];

    public function __construct(
        private readonly MessageBusInterface $commandBus,
        private readonly MessageBusInterface $queryBus,
        private readonly TokenStorageInterface $tokens,
        #[Autowire(service: 'security.user.provider.concrete.app_user_provider')]
        private readonly UserProviderInterface $users,
        private readonly ValidatorInterface $validator,
        private readonly NormalizerInterface $normalizer,
        private readonly Connection $connection,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('admin-email', null, InputOption::VALUE_REQUIRED, 'Compte de l’administrateur principal (créé par app:admin:bootstrap)', 'admin@example.com')
            ->addOption('email-domain', null, InputOption::VALUE_REQUIRED, 'Domaine des adresses fictives (citoyens et agents)', 'example.com');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->io = new SymfonyStyle($input, $output);
        $this->adminEmail = (string) $input->getOption('admin-email');
        $this->domain = (string) $input->getOption('email-domain');

        if (!$this->accountExists($this->adminEmail)) {
            $this->io->error(sprintf('Compte administrateur « %s » introuvable : lancez d’abord app:admin:bootstrap.', $this->adminEmail));

            return Command::FAILURE;
        }
        if ($this->accountExists($this->citizenEmail(0))) {
            $this->io->warning('Les données de démonstration sont déjà chargées (citoyen01 existe) : rien n’est modifié.');

            return Command::SUCCESS;
        }
        if (!$this->io->confirm(sprintf('Charger les données de démonstration (mot de passe commun « %s ») ?', DemoDataset::PASSWORD), !$input->isInteractive())) {
            return Command::SUCCESS;
        }

        // Tout ou rien : les transactions des commandes s'imbriquent dans celle-ci, messages Messenger compris.
        $this->connection->beginTransaction();
        try {
            $this->seedAdministration();
            $this->seedServices();
            $this->seedCommunication();
            $citizens = $this->seedCitizens();
            $this->seedRequests();
            $this->seedConcerns();
            $this->seedParticipation();
            $this->seedAppointments();
            $this->connection->commit();
        } catch (\Throwable $exception) {
            $this->connection->rollBack();
            $this->io->error(['Chargement annulé, aucune donnée n’a été enregistrée.', $exception->getMessage()]);

            return Command::FAILURE;
        } finally {
            $this->tokens->setToken(null);
        }

        $this->io->success('Données de démonstration chargées.');
        $this->io->table(['Compte', 'E-mail', 'Mot de passe'], [
            ['Administrateur principal', $this->adminEmail, '(inchangé)'],
            ...array_map(fn (array $agent) => [$agent[0], $agent[1].'@'.$this->domain, DemoDataset::PASSWORD], DemoDataset::AGENTS),
            ['20 citoyens', sprintf('%s … %s', $citizens[0], $citizens[19]), DemoDataset::PASSWORD],
        ]);

        return Command::SUCCESS;
    }

    private function seedAdministration(): void
    {
        $this->actAs($this->adminEmail);
        $existing = array_column($this->query(new ListRolesQuery()), 'id', 'name');
        foreach (DemoDataset::ROLES as $key => $role) {
            if (!isset($existing[$role['name']])) {
                $permissions = array_map(static function (string $permission): array {
                    [$resource, $action] = explode('.', $permission);

                    return ['context' => 'admin', 'resource' => $resource, 'action' => $action];
                }, $role['permissions']);
                $this->send(new CreateRoleCommand($role['name'], $permissions));
            }
        }
        $existing = array_column($this->query(new ListRolesQuery()), 'id', 'name');
        foreach (DemoDataset::ROLES as $key => $role) {
            $this->roleIds[$key] = $existing[$role['name']];
        }
        foreach (DemoDataset::AGENTS as [$name, $prefix, $role]) {
            if (!$this->accountExists($prefix.'@'.$this->domain)) {
                $this->send(new AddMemberCommand($name, $prefix.'@'.$this->domain, DemoDataset::PASSWORD, [$this->roleIds[$role]]));
            }
        }
        $this->io->writeln('✔ 3 rôles et 3 agents');
    }

    private function seedServices(): void
    {
        $this->actAs($this->agentEmail('technique'));
        foreach (DemoDataset::services() as $service) {
            $this->send(new SaveMunicipalServiceCommand(...$service));
        }
        $this->io->writeln(sprintf('✔ %d services', count(DemoDataset::services())));
    }

    private function seedCommunication(): void
    {
        $this->actAs($this->agentEmail('communication'));
        foreach (DemoDataset::publications() as $publication) {
            $this->send(new SavePublicationCommand(...$publication));
        }
        $now = new \DateTimeImmutable();
        $this->send(new SaveAlertCommand(
            title: 'Vents forts attendus sur le quartier Port',
            message: 'Des rafales de poussière sont attendues ce soir. Évitez les sorties hors des dômes et rentrez les objets légers.',
            severity: 'warning', audience: 'district', district: 'Port',
            startsAt: $now->modify('-1 hour')->format(DATE_ATOM), endsAt: $now->modify('+1 day')->format(DATE_ATOM),
            recommendations: ['Fermez les sas extérieurs', 'Reportez les trajets en rover', 'Suivez les consignes des agents'],
            state: 'published',
        ));
        $this->send(new SaveAlertCommand(
            title: 'Maintenance du réseau solaire',
            message: 'Des coupures d’électricité courtes sont possibles cette semaine entre 9 h et 12 h pendant la maintenance du réseau.',
            severity: 'info', audience: 'all',
            startsAt: $now->format(DATE_ATOM), endsAt: $now->modify('+3 days')->format(DATE_ATOM),
            state: 'published',
        ));
        $this->send(new SaveAlertCommand(
            title: 'Journée de recensement des nouveaux arrivants',
            message: 'Le Haut Conseil invite tous les habitants arrivés par le troisième convoi à se présenter à l’hôtel de ville avant la fin du mois pour leur recensement.',
            severity: 'info', audience: 'all',
            startsAt: $now->format(DATE_ATOM), endsAt: $now->modify('+7 days')->format(DATE_ATOM),
            state: 'published', category: 'official', signatory: 'Le Haut Conseil de Nova Terra', confirmOfficial: true,
        ));
        $this->io->writeln('✔ publications, 2 alertes et 1 message officiel');
    }

    /** @return list<string> e-mails des citoyens */
    private function seedCitizens(): array
    {
        $emails = [];
        foreach (DemoDataset::CITIZENS as $index => [$first, $last, $district, $phone]) {
            $email = $this->citizenEmail($index);
            $this->tokens->setToken(null);
            $this->send(new RegisterCitizenCommand($email, DemoDataset::PASSWORD));
            $this->actAs($email);
            $this->send(new UpdateMyCitizenProfileCommand(
                firstName: $first, lastName: $last, phone: $phone,
                address: sprintf('%d rue des Pionniers, quartier %s', 10 + $index, $district),
                district: $district, preferredLanguage: 'fr',
            ));
            $emails[] = $email;
        }
        $this->io->writeln('✔ 20 citoyens');

        return $emails;
    }

    private function seedRequests(): void
    {
        foreach (DemoDataset::requests() as [$citizen, $type, $service, $subject, $description, $location, $public, $medical]) {
            $this->actAs($this->citizenEmail($citizen));
            $this->requests[] = $this->send(new SubmitServiceRequestCommand(
                type: $type, subject: $subject, description: $description, location: $location,
                serviceId: $service, isPublic: $public, medicalEmergency: $medical,
            ));
        }
        foreach (DemoDataset::SUPPORTS as $index => $supporters) {
            foreach ($supporters as $citizen) {
                $this->actAs($this->citizenEmail($citizen));
                $this->send(new SupportRequestCommand($this->requests[$index]['id']));
            }
        }
        foreach (DemoDataset::requests() as $index => $request) {
            $handling = $request[8];
            if ($handling === null) {
                continue;
            }
            $this->actAs($this->agentEmail($handling['agent']));
            $id = $this->requests[$index]['id'];
            if (isset($handling['priority'])) {
                $this->send(new SetRequestPriorityCommand($id, $handling['priority'][0], $handling['priority'][1]));
            }
            $status = 'submitted';
            foreach ($handling['steps'] as [$next, $comment]) {
                $this->send(new ChangeRequestStatusCommand($id, $next, $status, $comment));
                $status = $next;
            }
            if (isset($handling['reply'])) {
                $this->send(new ReplyToRequestCommand($id, $handling['reply']));
            }
        }
        $this->actAs($this->agentEmail('technique'));
        foreach (DemoDataset::LINKS as $main => $others) {
            $this->send(new LinkRequestsCommand($this->requests[$main]['id'], array_map(fn (int $i) => $this->requests[$i]['id'], $others)));
        }
        $this->io->writeln(sprintf('✔ %d demandes et signalements, soutiens et traitements', count($this->requests)));
    }

    private function seedConcerns(): void
    {
        foreach (DemoDataset::CONCERNS as [$citizen, $topic, $subject, $message, $answer]) {
            $this->actAs($this->citizenEmail($citizen));
            $concern = $this->send(new RaiseConcernCommand($topic, $subject, $message));
            $this->actAs($this->agentEmail('accueil'));
            $this->send(new HandleConcernCommand($concern['id'], $answer === null ? 'in_review' : 'answered', $answer));
        }
        $this->io->writeln('✔ 4 inquiétudes');
    }

    private function seedParticipation(): void
    {
        $now = new \DateTimeImmutable();
        $this->actAs($this->agentEmail('communication'));
        $park = $this->send(new SaveProjectCommand(
            title: 'Parc suspendu du dôme Ouest',
            summary: 'Un jardin public sur la toiture du dôme Ouest, avec aire de jeux et vue sur les plaines.',
            description: ['Le dôme Ouest accueillera un parc suspendu de 2 000 m², planté d’espèces adaptées à la faible gravité.', 'Le projet comprend une aire de jeux, des bancs et un belvédère.'],
            status: 'in_progress',
            steps: [['label' => 'Étude de faisabilité', 'date' => $now->modify('-60 days')->format('Y-m-d'), 'done' => true], ['label' => 'Consultation des habitants', 'date' => $now->format('Y-m-d'), 'done' => false], ['label' => 'Ouverture au public', 'date' => $now->modify('+180 days')->format('Y-m-d')]],
            nextStep: 'Donnez votre avis sur l’aménagement avant la fin de la consultation.',
            district: 'Ouest', state: 'published',
        ));
        $this->send(new SaveProjectCommand(
            title: 'Nouvelle ligne de navette Port – Serres',
            summary: 'Une ligne directe entre le port et les serres du Sud pour les travailleurs agricoles.',
            description: ['La ligne reliera le quai des Convois aux serres du Sud en 12 minutes, toutes les 15 minutes aux heures de pointe.'],
            status: 'study', district: 'Port', state: 'published',
            nextStep: 'Choix du tracé définitif.',
        ));
        $this->send(new SaveProjectCommand(
            title: 'Rénovation de l’éclairage public',
            summary: 'Remplacement de tous les lampadaires par un éclairage économe.',
            description: ['Plus de 1 200 lampadaires ont été remplacés, pour une économie d’énergie de 40 %.'],
            status: 'done', state: 'published',
            steps: [['label' => 'Avenue des Pionniers', 'date' => $now->modify('-10 days')->format('Y-m-d'), 'done' => true]],
        ));
        $choice = $this->send(new SaveConsultationCommand(
            kind: 'consultation', title: 'Quel aménagement pour le parc suspendu ?',
            question: 'Quel équipement souhaitez-vous en priorité dans le parc du dôme Ouest ?',
            opensAt: $now->modify('-3 days')->format(DATE_ATOM), closesAt: $now->modify('+14 days')->format(DATE_ATOM),
            description: ['Le budget permet de réaliser un équipement principal dès l’ouverture.'],
            options: ['Une grande aire de jeux', 'Un jardin potager partagé', 'Un espace de sport en plein air', 'Un belvédère avec télescopes'],
            projectId: $park['id'], state: 'published',
        ));
        $opinion = $this->send(new SaveConsultationCommand(
            kind: 'opinion', title: 'Votre avis sur les horaires des navettes',
            question: 'Les horaires actuels des navettes vous conviennent-ils ?',
            opensAt: $now->modify('-1 day')->format(DATE_ATOM), closesAt: $now->modify('+10 days')->format(DATE_ATOM),
            description: ['Vos réponses aideront à adapter le réseau en début d’année.'], state: 'published',
        ));
        $this->send(new SaveConsultationCommand(
            kind: 'opinion', title: 'Fête des convois 2027',
            question: 'Quelles animations aimeriez-vous pour la prochaine fête des convois ?',
            opensAt: $now->modify('+20 days')->format(DATE_ATOM), closesAt: $now->modify('+40 days')->format(DATE_ATOM),
            state: 'published',
        ));

        $ratings = ['positive', 'mixed', 'negative'];
        foreach (range(0, 13) as $citizen) {
            $this->actAs($this->citizenEmail($citizen));
            $this->send(new SubmitContributionCommand($choice['id'], choice: (string) ($citizen % 4 + 1), comment: $citizen % 3 === 0 ? 'Pensez aux familles avec de jeunes enfants.' : null));
            if ($citizen % 2 === 0) {
                $this->send(new SubmitContributionCommand($opinion['id'], rating: $ratings[$citizen % 3], comment: $citizen % 3 === 2 ? 'Trop d’attente le soir après 21 h.' : null));
            }
        }

        $ideas = [];
        foreach (DemoDataset::IDEAS as [$citizen, $title, $description, $district]) {
            $this->actAs($this->citizenEmail($citizen));
            $ideas[] = $this->send(new ProposeIdeaCommand($title, $description, $district));
        }
        $reviews = [];
        foreach (DemoDataset::REVIEWS as [$citizen, $service, $rating, $needMet, $comment]) {
            $this->actAs($this->citizenEmail($citizen));
            $reviews[] = $this->send(new ReviewServiceCommand($service, $rating, $needMet, $comment));
        }

        $this->actAs($this->agentEmail('communication'));
        foreach (DemoDataset::IDEAS as $index => $idea) {
            if ($idea[4] !== null) {
                $this->send(new FollowIdeaCommand($ideas[$index]['id'], $idea[4][0], $idea[4][1]));
            }
        }
        foreach (DemoDataset::REVIEWS as $index => $review) {
            $this->send($review[5] === null
                ? new HandleServiceReviewCommand($reviews[$index]['id'], 'read')
                : new HandleServiceReviewCommand($reviews[$index]['id'], 'respond', $review[5]));
        }
        $this->io->writeln('✔ 3 projets, 3 consultations, réponses, 6 idées et 10 avis');
    }

    private function seedAppointments(): void
    {
        $this->actAs($this->agentEmail('technique'));
        $slots = [];
        foreach (['+1 day', '+2 days', '+3 days'] as $day) {
            $date = (new \DateTimeImmutable($day))->format('Y-m-d');
            $slots = [...$slots, ...$this->send(new OpenAppointmentSlotsCommand('etat-civil', $date, '09:00', 30, 6, 'Hôtel de ville, guichet 1', 'Munissez-vous d’une pièce d’identité.'))['items']];
            $this->send(new OpenAppointmentSlotsCommand('sante', $date, '14:00', 20, 6, 'Centre médical Aurore', 'Apportez votre carnet de vaccination.'));
        }
        foreach ([1, 4, 7, 10, 13, 16] as $position => $citizen) {
            $this->actAs($this->citizenEmail($citizen));
            $this->send(new BookAppointmentCommand($slots[$position * 3]['id']));
        }
        $this->io->writeln('✔ 36 créneaux et 6 rendez-vous');
    }

    private function citizenEmail(int $index): string
    {
        return sprintf('citoyen%02d@%s', $index + 1, $this->domain);
    }

    private function agentEmail(string $key): string
    {
        return DemoDataset::AGENTS[$key][1].'@'.$this->domain;
    }

    private function accountExists(string $email): bool
    {
        try {
            $this->users->loadUserByIdentifier($email);

            return true;
        } catch (UserNotFoundException) {
            return false;
        }
    }

    /** Ouvre la « session » du compte : les cas d'usage lisent l'acteur dans le jeton de sécurité, comme en HTTP. */
    private function actAs(string $email): void
    {
        $user = $this->users->loadUserByIdentifier($email);
        $this->tokens->setToken(new UsernamePasswordToken($user, 'main', $user->getRoles()));
    }

    /** @return array<string, mixed> */
    private function send(object $command): array
    {
        $violations = $this->validator->validate($command);
        if (count($violations) > 0) {
            throw new \RuntimeException(sprintf('%s invalide : %s', $command::class, (string) $violations));
        }
        try {
            $result = $this->commandBus->dispatch($command)->last(HandledStamp::class)?->getResult();
        } catch (HandlerFailedException $exception) {
            throw new \RuntimeException(sprintf('%s refusée : %s', $command::class, $exception->getPrevious()?->getMessage()), previous: $exception);
        }

        return $this->toArray($result);
    }

    /** @return array<mixed> */
    private function query(object $query): array
    {
        return $this->toArray($this->queryBus->dispatch($query)->last(HandledStamp::class)?->getResult());
    }

    /** @return array<mixed> */
    private function toArray(mixed $result): array
    {
        $normalized = $result === null ? [] : $this->normalizer->normalize($result);

        return is_array($normalized) ? $normalized : [];
    }
}
