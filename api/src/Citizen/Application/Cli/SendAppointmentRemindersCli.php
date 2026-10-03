<?php

declare(strict_types=1);

namespace Citizen\Application\Cli;

use Citizen\Application\Command\SendAppointmentReminders\SendAppointmentRemindersCommand;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;

/**
 * F40 — cron recommandé toutes les 10 minutes : `php bin/console app:appointments:remind`.
 * Passe par le `command.bus` (transaction) ; relancer la commande ne renvoie pas un rappel déjà envoyé.
 */
#[AsCommand(name: 'app:appointments:remind', description: 'Send appointment reminders (day before and 2 hours before) to citizens.')]
final class SendAppointmentRemindersCli extends Command
{
    public function __construct(private readonly MessageBusInterface $commandBus)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $result = $this->commandBus->dispatch(new SendAppointmentRemindersCommand())->last(HandledStamp::class)?->getResult();
        $output->writeln(sprintf('%d reminder(s) sent.', is_array($result) ? (int) ($result['sent'] ?? 0) : 0));

        return Command::SUCCESS;
    }
}
