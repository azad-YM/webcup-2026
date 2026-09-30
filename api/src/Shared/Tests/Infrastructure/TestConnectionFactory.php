<?php

declare(strict_types=1);

namespace Tests\Shared\Infrastructure;

use Doctrine\Bundle\DoctrineBundle\ConnectionFactory;
use Doctrine\Common\EventManager;
use Doctrine\DBAL\Configuration;
use Doctrine\DBAL\Connection;
use Testcontainers\Container\StartedTestContainer;
use Testcontainers\Modules\MySQLContainer;
use Testcontainers\Wait\WaitForExec;

final class TestConnectionFactory extends ConnectionFactory
{
    private static ?StartedTestContainer $database = null;

    public function createConnection(array $params, ?Configuration $config = null, ?EventManager $eventManager = null, array $mappingTypes = []): Connection
    {
        if (($_SERVER['APP_ENV'] ?? null) !== 'test') {
            throw new \LogicException('Testcontainers is reserved for APP_ENV=test.');
        }

        if (self::$database === null) {
            self::$database = (new MySQLContainer('8.4'))
                ->withMySQLUser('app_test', 'test-password')
                ->withMySQLDatabase('app_test')
                ->withWait(new WaitForExec(
                    ['mysql', '-h', '127.0.0.1', '-u', 'app_test', '-ptest-password', 'app_test', '-e', 'SELECT 1'],
                    timeout: 120000,
                ))
                ->start();
            register_shutdown_function(static function (): void {
                self::$database?->stop();
                self::$database = null;
            });
        }

        // No URL, suffix, replica or credentials inherited from application configuration.
        return parent::createConnection([
            'driver' => 'pdo_mysql',
            'host' => self::$database->getHost(),
            'port' => self::$database->getMappedPort(3306),
            'user' => 'app_test',
            'password' => 'test-password',
            'dbname' => 'app_test',
            'serverVersion' => '8.4.0',
            'charset' => 'utf8mb4',
        ], $config, $eventManager, $mappingTypes);
    }

    public static function assertIsolated(Connection $connection): void
    {
        $params = $connection->getParams();
        if (self::$database === null || ($params['dbname'] ?? null) !== 'app_test'
            || ($params['host'] ?? null) !== self::$database->getHost()
            || ($params['port'] ?? null) !== self::$database->getMappedPort(3306)) {
            throw new \LogicException('Schema reset requires the database managed by Testcontainers.');
        }
    }
}
