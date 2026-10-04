<?php

declare(strict_types=1);

namespace Citizen\Application\Cli;

use Citizen\Application\Command\ReassessRequestPriorities\ReassessRequestPrioritiesCommand;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;

/** F80 : cron (toutes les heures conseillé) qui fait monter les demandes qui attendent ou que les habitants soutiennent. */
#[AsCommand(name: 'app:requests:reprioritize', description: 'Réévalue les priorités automatiques des demandes ouvertes (ancienneté, soutiens).')]
final class ReassessRequestPrioritiesCli extends Command
{
    public function __construct(private readonly MessageBusInterface $commandBus)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('limit', null, InputOption::VALUE_REQUIRED, 'Nombre maximal de demandes examinées', '1000');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $result = $this->commandBus->dispatch(new ReassessRequestPrioritiesCommand((int) $input->getOption('limit')))
            ->last(HandledStamp::class)?->getResult();
        $output->writeln(sprintf('%d demande(s) examinée(s), %d priorité(s) relevée(s).', $result['checked'] ?? 0, $result['changed'] ?? 0));

        return Command::SUCCESS;
    }
}
