<?php

declare(strict_types=1);

namespace Tests\Pilotage\Suites\Application;

use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Pilotage\Domain\Entity\RequestTracking;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;
use Tests\Shared\Infrastructure\ApplicationTestCase;

#[Group('Application')]
final class SyncTrackingCliTest extends ApplicationTestCase
{
    public function testConsolePreviewApplyAndSecondRun(): void
    {
        $this->initialize();
        $application = new Application(self::$kernel);
        $tester = new CommandTester($application->find('app:pilotage:sync-tracking'));
        $options = ['--site-url' => 'https://city.example', '--admin-url' => 'https://admin.example'];
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        self::assertSame(0, $tester->execute($options));
        self::assertSame(0, $manager->getRepository(RequestTracking::class)->count([]));
        self::assertSame(0, $tester->execute($options + ['--apply' => true]));
        $manager->clear();
        self::assertSame(71, $manager->getRepository(RequestTracking::class)->count([]));
        self::assertSame('done', $manager->find(RequestTracking::class, 'D01')->status());
        self::assertSame(0, $tester->execute($options + ['--apply' => true]));
        self::assertStringContainsString('0 changement(s)', $tester->getDisplay());
    }
}
