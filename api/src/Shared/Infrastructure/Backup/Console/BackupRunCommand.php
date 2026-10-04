<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Backup\Console;

use Shared\Infrastructure\Backup\BackupRunner;
use Shared\Infrastructure\Backup\BackupVerifier;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/** F87 : sauvegarde logique des tables importantes (cron quotidien), suivie au besoin de sa vérification. */
#[AsCommand(name: 'app:backup:run', description: 'Sauvegarde les tables importantes de chaque BC (compressé, horodaté, somme de contrôle, rétention).')]
final class BackupRunCommand extends Command
{
    public function __construct(private readonly BackupRunner $runner, private readonly BackupVerifier $verifier)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('verify', null, InputOption::VALUE_NONE, 'Vérifie aussitôt la sauvegarde produite (restauration d’essai).');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $report = $this->runner->run();
        BackupReportPrinter::print($io, $report);
        if ($input->getOption('verify')) {
            $report = $this->verifier->verify((string) $report['backupId']);
            BackupReportPrinter::print($io, $report);
        }

        return $report['verdict'] === 'failed' ? Command::FAILURE : Command::SUCCESS;
    }
}
