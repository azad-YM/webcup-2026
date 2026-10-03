<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime\Console;

use Shared\Application\Ports\Service\IClock;
use Shared\Infrastructure\Realtime\RealtimeEventRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/** `realtime_event` is a buffer, not a history: run by cron (e.g. every 10 minutes). */
#[AsCommand(name: 'app:realtime:purge', description: 'Delete buffered realtime events older than the given age.')]
final class PurgeRealtimeEventsCommand extends Command
{
    public function __construct(private readonly RealtimeEventRepository $events, private readonly IClock $clock)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('older-than', null, InputOption::VALUE_REQUIRED, 'Age in seconds', '3600');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $seconds = max(60, (int) $input->getOption('older-than'));
        $deleted = $this->events->purgeOlderThan($this->clock->now()->modify(sprintf('-%d seconds', $seconds)));
        $output->writeln(sprintf('%d realtime event(s) older than %d s deleted.', $deleted, $seconds));

        return Command::SUCCESS;
    }
}
