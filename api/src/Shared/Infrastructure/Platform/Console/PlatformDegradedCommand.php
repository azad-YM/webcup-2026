<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Platform\Console;

use Shared\Infrastructure\Platform\PlatformState;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/** F77 : interrupteur du mode allégé (`on`, `off`, `status`). */
#[AsCommand(name: 'app:platform:degraded', description: 'Active, lève ou affiche le mode allégé (surcharge).')]
final class PlatformDegradedCommand extends Command
{
    public function __construct(private readonly PlatformState $state)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('action', InputArgument::OPTIONAL, 'on | off | status', 'status')
            ->addOption('reason', null, InputOption::VALUE_REQUIRED, 'Raison affichée aux agents', '');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $action = strtolower((string) $input->getArgument('action'));
        match ($action) {
            'on' => $this->state->enable((string) $input->getOption('reason')),
            'off' => $this->state->disable(),
            'status' => null,
            default => throw new \InvalidArgumentException('Action attendue : on, off ou status.'),
        };
        $current = $this->state->current();
        $io->definitionList(
            ['Mode' => $current['mode'] === 'degraded' ? 'allégé (dégradé)' : 'normal'],
            ['Source' => $current['source'] ?? '—'],
            ['Depuis' => $current['since'] ?? '—'],
            ['Jusqu’à' => $current['until'] ?? '—'],
            ['Raison' => $current['reason'] !== '' ? $current['reason'] : '—'],
        );
        if ($action === 'off' && $current['source'] === 'env') {
            $io->warning('PLATFORM_DEGRADED=on force le mode allégé : modifiez la variable d’environnement.');
        }

        return Command::SUCCESS;
    }
}
