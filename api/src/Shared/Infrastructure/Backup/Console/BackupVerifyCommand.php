<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup\Console;

use Shared\Infrastructure\Backup\BackupVerifier;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/** F87 : vérifie une sauvegarde (la plus récente par défaut) et écrit un rapport lisible dans l'admin. */
#[AsCommand(name: 'app:backup:verify', description: 'Vérifie une sauvegarde : sommes de contrôle, relecture, restauration d’essai, rapport.')]
final class BackupVerifyCommand extends Command
{
    public function __construct(private readonly BackupVerifier $verifier)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('backup', InputArgument::OPTIONAL, 'Identifiant de la sauvegarde (ex. 20261004T020000Z)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $report = $this->verifier->verify($input->getArgument('backup'));
        BackupReportPrinter::print(new SymfonyStyle($input, $output), $report);

        return $report['verdict'] === 'failed' ? Command::FAILURE : Command::SUCCESS;
    }
}
