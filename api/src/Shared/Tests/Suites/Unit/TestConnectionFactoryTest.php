<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use Doctrine\DBAL\DriverManager;
use PHPUnit\Framework\TestCase;
use Tests\Shared\Infrastructure\TestConnectionFactory;

#[\PHPUnit\Framework\Attributes\Group('Unit')]
final class TestConnectionFactoryTest extends TestCase
{
    public function test_shouldRejectSchemaResetOnUnmanagedConnection(): void
    {
        $connection = DriverManager::getConnection(['driver' => 'pdo_sqlite', 'memory' => true]);
        $this->expectException(\LogicException::class);
        TestConnectionFactory::assertIsolated($connection);
    }

    public function test_shouldRejectFactoryOutsideTestEnvironment(): void
    {
        $previous = $_SERVER['APP_ENV'];
        $_SERVER['APP_ENV'] = 'prod';
        try {
            $this->expectException(\LogicException::class);
            (new TestConnectionFactory())->createConnection([]);
        } finally {
            $_SERVER['APP_ENV'] = $previous;
        }
    }
}
