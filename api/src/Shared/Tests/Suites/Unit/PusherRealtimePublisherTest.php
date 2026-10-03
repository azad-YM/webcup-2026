<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Psr\Log\AbstractLogger;
use Shared\Application\Ports\Service\IClock;
use Shared\Infrastructure\Realtime\PusherRealtimePublisher;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/** The Pusher adapter with Symfony's MockHttpClient: signed request, disabled mode and swallowed failures. */
#[Group('Unit')]
final class PusherRealtimePublisherTest extends TestCase
{
    /** Credentials and timestamp of the example in Pusher's HTTP API reference ("Generating authentication signatures"). */
    private const APP_ID = '3';
    private const KEY = '278d425bdf160c739803';
    private const SECRET = '7ad3773142a6692b25b8';
    private const TIMESTAMP = 1353088179;

    /** @var list<string> */
    private array $logs = [];

    public function testSendsTheEventSignedLikeThePusherReferenceExample(): void
    {
        $requests = [];
        $client = new MockHttpClient(function (string $method, string $url, array $options) use (&$requests) {
            $requests[] = [$method, $url, $options['body']];

            return new MockResponse('{}', ['http_code' => 200]);
        });

        $this->publisher($client)->publish('project-3', 'foo', ['some' => 'data']);

        self::assertCount(1, $requests);
        [$method, $url, $body] = $requests[0];
        self::assertSame('POST', $method);
        self::assertSame('{"name":"foo","channels":["project-3"],"data":"{\"some\":\"data\"}"}', $body);
        $parts = parse_url($url);
        self::assertSame('api-eu.pusher.com', $parts['host']);
        self::assertSame('/apps/3/events', $parts['path']);
        parse_str($parts['query'], $query);
        self::assertSame(self::KEY, $query['auth_key']);
        self::assertSame((string) self::TIMESTAMP, $query['auth_timestamp']);
        self::assertSame('1.0', $query['auth_version']);
        self::assertSame('ec365a775a4cd0599faeb73354201b6f', $query['body_md5']);
        self::assertSame('da454824c97ba181a32ccc17a72625ba02771f50b50e1e7430e47a1f3f457e6c', $query['auth_signature']);
        self::assertStringNotContainsString(self::SECRET, $url . $body);
    }

    public function testDoesNothingWithoutCredentials(): void
    {
        $client = new MockHttpClient(static fn () => self::fail('No HTTP call expected without credentials.'));

        $this->publisher($client, secret: '')->publish('public.alerts', 'alert.published', ['id' => 'a1']);

        self::assertSame(0, $client->getRequestsCount());
    }

    public function testLogsAndSwallowsAnUnreachableService(): void
    {
        $client = new MockHttpClient(new MockResponse('', ['error' => 'connection refused']));

        $this->publisher($client)->publish('public.alerts', 'alert.published', ['id' => 'a1']);

        self::assertSame(['Pusher is unreachable, realtime event dropped.'], $this->logs);
    }

    public function testLogsARefusedEvent(): void
    {
        $client = new MockHttpClient(new MockResponse('Unknown auth_key', ['http_code' => 401]));

        $this->publisher($client)->publish('public.alerts', 'alert.published', ['id' => 'a1']);

        self::assertSame(['Pusher refused a realtime event.'], $this->logs);
    }

    public function testSkipsAPayloadAboveThePusherLimit(): void
    {
        $client = new MockHttpClient(static fn () => self::fail('No HTTP call expected for an oversized payload.'));

        $this->publisher($client)->publish('public.alerts', 'alert.published', ['content' => str_repeat('x', PusherRealtimePublisher::MAX_DATA_BYTES)]);

        self::assertSame(['Realtime payload too large, not published.'], $this->logs);
    }

    public function testRejectsAMalformedTopic(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->publisher(new MockHttpClient())->publish('/public/alerts', 'alert.published');
    }

    private function publisher(MockHttpClient $client, string $secret = self::SECRET): PusherRealtimePublisher
    {
        $clock = new class implements IClock {
            public function now(): \DateTimeImmutable
            {
                return new \DateTimeImmutable('@' . PusherRealtimePublisherTest::timestamp());
            }
        };
        $logger = new class($this->logs) extends AbstractLogger {
            /** @param list<string> $logs */
            public function __construct(private array &$logs) {}

            public function log($level, \Stringable|string $message, array $context = []): void
            {
                if ($level !== 'debug') {
                    $this->logs[] = (string) $message;
                }
            }
        };

        return new PusherRealtimePublisher($client, $clock, self::APP_ID, self::KEY, $secret, 'eu', $logger);
    }

    public static function timestamp(): int
    {
        return self::TIMESTAMP;
    }
}
