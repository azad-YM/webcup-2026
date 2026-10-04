<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Psr\Log\AbstractLogger;
use Shared\Infrastructure\Realtime\MercureRealtimePublisher;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/** The Mercure adapter with Symfony's MockHttpClient: form update, publisher JWT, disabled mode and swallowed failures. */
#[Group('Unit')]
final class MercureRealtimePublisherTest extends TestCase
{
    private const HUB = 'http://mercure/.well-known/mercure';
    private const SECRET = 'dev-only-mercure-secret-at-least-32-bytes-long';

    /** @var list<string> */
    private array $logs = [];

    public function testPostsTheUpdateWithASignedPublisherToken(): void
    {
        $requests = [];
        $client = new MockHttpClient(function (string $method, string $url, array $options) use (&$requests) {
            $requests[] = [$method, $url, $options];

            return new MockResponse('urn:uuid:1', ['http_code' => 200]);
        });

        $this->publisher($client)->publish('public.alerts', 'alert.published', ['id' => 'a1']);

        self::assertCount(1, $requests);
        [$method, $url, $options] = $requests[0];
        self::assertSame('POST', $method);
        self::assertSame(self::HUB, $url);
        parse_str($options['body'], $form);
        self::assertSame(['topic' => 'public.alerts', 'type' => 'alert.published', 'data' => '{"id":"a1"}'], $form);

        $authorization = implode("\n", $options['headers']);
        self::assertMatchesRegularExpression('/Authorization: Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)/', $authorization);
        preg_match('/Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)/', $authorization, $jwt);
        $decode = static fn (string $part): array => json_decode(base64_decode(strtr($part, '-_', '+/')), true);
        self::assertSame(['alg' => 'HS256', 'typ' => 'JWT'], $decode($jwt[1]));
        self::assertSame(['mercure' => ['publish' => ['*']]], $decode($jwt[2]));
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $jwt[1] . '.' . $jwt[2], self::SECRET, true)), '+/', '-_'), '=');
        self::assertSame($expected, $jwt[3]);
        self::assertStringNotContainsString(self::SECRET, $url . $options['body'] . $authorization);
    }

    public function testDoesNothingWithoutHubOrSecret(): void
    {
        $client = new MockHttpClient(static fn () => self::fail('No HTTP call expected without configuration.'));

        $this->publisher($client, secret: '')->publish('public.alerts', 'alert.published');
        $this->publisher($client, hub: '')->publish('public.alerts', 'alert.published');

        self::assertSame(0, $client->getRequestsCount());
    }

    public function testLogsAndSwallowsAnUnreachableHubOrARefusal(): void
    {
        $this->publisher(new MockHttpClient(new MockResponse('', ['error' => 'connection refused'])))->publish('public.alerts', 'alert.published');
        $this->publisher(new MockHttpClient(new MockResponse('', ['http_code' => 401])))->publish('public.alerts', 'alert.published');

        self::assertSame(['Mercure is unreachable, realtime event dropped.', 'Mercure refused a realtime event.'], $this->logs);
    }

    public function testRejectsAMalformedTopic(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->publisher(new MockHttpClient())->publish('Public Alerts', 'alert.published');
    }

    private function publisher(MockHttpClient $client, string $hub = self::HUB, string $secret = self::SECRET): MercureRealtimePublisher
    {
        $logs = &$this->logs;
        $logger = new class ($logs) extends AbstractLogger {
            public function __construct(private array &$logs) {}

            public function log($level, \Stringable|string $message, array $context = []): void
            {
                if ($level !== 'debug') {
                    $this->logs[] = (string) $message;
                }
            }
        };

        return new MercureRealtimePublisher($client, $hub, $secret, $logger);
    }
}
