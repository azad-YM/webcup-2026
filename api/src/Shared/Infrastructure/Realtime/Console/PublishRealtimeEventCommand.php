<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Realtime\Console;

use Shared\Application\Ports\Service\RealtimePublisher;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/** Diagnostic: pushes an event through the configured transport to check the chain up to the browser. */
#[AsCommand(name: 'app:realtime:publish', description: 'Publish a test realtime event (diagnostic).')]
final class PublishRealtimeEventCommand extends Command
{
    public function __construct(private readonly RealtimePublisher $publisher)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('topic', InputArgument::OPTIONAL, 'Logical topic', 'public.diagnostic')
            ->addArgument('event', InputArgument::OPTIONAL, 'Event name', 'diagnostic.ping')
            ->addArgument('payload', InputArgument::OPTIONAL, 'JSON object', '{"message":"Bonjour Nova Terra"}');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $payload = json_decode((string) $input->getArgument('payload'), true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($payload)) {
            throw new \InvalidArgumentException('The payload must be a JSON object.');
        }
        $this->publisher->publish((string) $input->getArgument('topic'), (string) $input->getArgument('event'), $payload);
        $output->writeln('Published.');

        return Command::SUCCESS;
    }
}
