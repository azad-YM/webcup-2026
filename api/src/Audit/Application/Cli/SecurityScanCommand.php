<?php

declare(strict_types=1);

namespace Audit\Application\Cli;

use Audit\Application\Command\ScanUnusualActivity\ScanUnusualActivityCommand;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;

/** F85 : analyse planifiée de l'activité inhabituelle (cron toutes les 5 minutes), via le `command.bus`. */
#[AsCommand(name: 'app:security:scan', description: 'Détecte l’activité inhabituelle et les informations incohérentes (F85).')]
final class SecurityScanCommand extends Command
{
    public function __construct(private readonly MessageBusInterface $commandBus)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $result = $this->commandBus->dispatch(new ScanUnusualActivityCommand('schedule'))->last(HandledStamp::class)?->getResult();
        (new SymfonyStyle($input, $output))->success(sprintf(
            '%d anomalie(s) observée(s), %d nouvelle(s), %d grave(s), %d compte(s) protégé(s).',
            $result['detected'] ?? 0,
            $result['created'] ?? 0,
            $result['critical'] ?? 0,
            $result['reactions'] ?? 0,
        ));

        return Command::SUCCESS;
    }
}
