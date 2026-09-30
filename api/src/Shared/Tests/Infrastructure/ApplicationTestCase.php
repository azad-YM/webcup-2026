<?php

declare(strict_types=1);

namespace Tests\Shared\Infrastructure;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Tests\Shared\Fixtures\Fixture;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApplicationTestCase extends WebTestCase
{
    protected static KernelBrowser $client;

    protected function initialize(): KernelBrowser
    {
        self::ensureKernelShutdown();
        TestJwtKeys::initialize();
        self::$client = self::createClient();
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        TestConnectionFactory::assertIsolated($manager->getConnection());
        $metadata = $manager->getMetadataFactory()->getAllMetadata();
        $schema = new SchemaTool($manager);
        $schema->dropSchema($metadata);
        $schema->createSchema($metadata);

        return self::$client;
    }

    protected function request(string $method, string $uri, ?array $body = null): void
    {
        self::$client->request($method, $uri, server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], content: $body === null ? null : json_encode($body, JSON_THROW_ON_ERROR));
        $this->afterRequest();
    }

    protected function afterRequest(): void
    {
        self::getContainer()->get(EntityManagerInterface::class)->clear();
    }

    /** @param list<Fixture> $fixtures */
    protected function load(array $fixtures): void
    {
        foreach ($fixtures as $fixture) {
            $fixture->load(self::getContainer());
        }
        self::getContainer()->get(EntityManagerInterface::class)->flush();
    }
}
