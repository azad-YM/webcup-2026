<?php

declare(strict_types=1);

namespace Pilotage\Application\Cli;

use Pilotage\Application\Command\SyncTracking\SyncTrackingCommand;
use Shared\Domain\Exception\DomainException;
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

/**
 * Applies the versioned TrackingSnapshot to this environment's database (see doc « Synchroniser le suivi en production »).
 * Preview by default; `--apply` writes through `command.bus` (single transaction). Access = server console.
 */
#[AsCommand(name: 'app:pilotage:sync-tracking', description: 'Synchronise le suivi validé du chantier (prévisualisation par défaut).')]
final class SyncTrackingCli extends Command
{
    public function __construct(#[Autowire(service: 'command.bus')] private readonly MessageBusInterface $bus)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('site-url', null, InputOption::VALUE_REQUIRED, 'URL publique du site')
            ->addOption('admin-url', null, InputOption::VALUE_REQUIRED, 'URL publique de l’administration')
            ->addOption('apply', null, InputOption::VALUE_NONE, 'Enregistrer les changements dans la base de cet environnement');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $siteUrl = trim((string) $input->getOption('site-url'));
        $adminUrl = trim((string) $input->getOption('admin-url'));
        if ($siteUrl === '' || $adminUrl === '') {
            $io->error('--site-url et --admin-url sont obligatoires.');
            return Command::INVALID;
        }
        $apply = (bool) $input->getOption('apply');
        try {
            $changes = $this->bus->dispatch(new SyncTrackingCommand($siteUrl, $adminUrl, $apply))
                ->last(HandledStamp::class)?->getResult() ?? [];
        } catch (HandlerFailedException $failure) {
            // Invalid URL or snapshot row: the handler validates the whole batch first, nothing was written.
            $cause = $failure->getPrevious();
            if ($cause instanceof \InvalidArgumentException || $cause instanceof DomainException) {
                $io->error($cause->getMessage().' Aucune écriture.');
                return Command::INVALID;
            }
            throw $failure;
        }
        $io->section($apply ? 'Changements enregistrés' : 'Prévisualisation');
        if ($changes === []) {
            $io->text('Suivi déjà à jour.');
        } else {
            $io->table(['Code', 'Avant', 'Après', 'Note', 'Lien'], $changes);
        }
        $io->success(sprintf('%d changement(s) %s.', count($changes), $apply ? 'enregistré(s)' : 'prévu(s), aucune écriture ; ajouter --apply pour enregistrer'));
        return Command::SUCCESS;
    }
}
