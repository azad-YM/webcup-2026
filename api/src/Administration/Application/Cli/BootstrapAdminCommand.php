<?php

declare(strict_types=1);

namespace Administration\Application\Cli;

use Administration\Infrastructure\Service\BootstrapAdminService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:admin:bootstrap', description: 'Initialize the principal administrator and the reference administration roles.')]
final class BootstrapAdminCommand extends Command
{
    public function __construct(private readonly BootstrapAdminService $bootstrap) { parent::__construct(); }

    protected function configure(): void
    {
        $this->addOption('email', null, InputOption::VALUE_REQUIRED, 'Principal account email', 'admin@example.com');
        $this->addOption('password', null, InputOption::VALUE_REQUIRED, 'Initial password; existing passwords are preserved', 'password');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $result = $this->bootstrap->initialize((string) $input->getOption('email'), (string) $input->getOption('password'));
        (new SymfonyStyle($input, $output))->success(sprintf('Principal administrator ready: %s (%d permissions). Reference role "municipal-agent" ready. Existing passwords are preserved.', $input->getOption('email'), $result['permissions']));
        return Command::SUCCESS;
    }
}
