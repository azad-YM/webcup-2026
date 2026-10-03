<?php

declare(strict_types=1);

namespace Tests\Pilotage\Suites\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Pilotage\Application\Exception\WebcupApiKeyMissing;
use Pilotage\Application\Exception\WebcupApiKeyRejected;
use Pilotage\Application\Exception\WebcupFeedUnavailable;
use Pilotage\Infrastructure\Http\WebcupHttpFeedGateway;
use Psr\Log\AbstractLogger;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Tests\Pilotage\Doubles\Http\WebcupApiSimulator;

/** The adapter with Symfony's MockHttpClient: header, mapping, 20 s cache and error translation. */
#[Group('Unit')]
final class WebcupHttpFeedGatewayTest extends TestCase
{
    private const URL = 'https://webcup.example.test/requests';
    private const KEY = 'secret-webcup-key';

    /** @var list<string> */
    private array $logs = [];

    public function testSendsTheKeyInTheHeaderAndMapsTheDocumentedFields(): void
    {
        $requests = [];
        $client = new MockHttpClient(function (string $method, string $url, array $options) use (&$requests) {
            $requests[] = [$method, $url, $options['headers']];

            return new MockResponse(json_encode(WebcupApiSimulator::samplePayload()), ['http_code' => 200]);
        });
        $feed = $this->gateway($client)->fetch();

        self::assertSame('GET', $requests[0][0]);
        self::assertSame(self::URL, $requests[0][1]);
        self::assertContains('X-Webcup-Api-Key: ' . self::KEY, $requests[0][2]);
        self::assertSame(['D01', 'F21'], array_map(static fn ($request) => $request->requestCode, $feed->requests));
        $d01 = $feed->requests[0];
        self::assertSame(1, $d01->difficultyLevel);
        self::assertSame(250, $d01->xpBase);
        self::assertTrue($d01->isInitial);
        self::assertFalse($d01->isAiRequest);
        self::assertNull($d01->groupName);
        self::assertSame('00:00:00', $d01->arrivalTime);
        self::assertSame(3, $feed->session->currentWave);
        self::assertSame(19, $feed->session->minutesUntilNextWave);
        self::assertSame(770, $feed->totalXpAvailable());
        self::assertSame('2026-10-03T12:00:00+00:00', $feed->fetchedAt->format(\DateTimeInterface::ATOM));
    }

    public function testServesTheCachedAnswerInsteadOfCallingTheApiAgain(): void
    {
        $client = new MockHttpClient([new MockResponse(json_encode(WebcupApiSimulator::samplePayload()))]);
        $gateway = $this->gateway($client);
        $first = $gateway->fetch();
        $second = $gateway->fetch();
        self::assertSame(1, $client->getRequestsCount());
        self::assertEquals($first->fetchedAt, $second->fetchedAt);
    }

    public function testMissingKeyFailsWithoutAnyCall(): void
    {
        $client = new MockHttpClient([]);
        $this->expectException(WebcupApiKeyMissing::class);
        try {
            $this->gateway($client, key: '  ')->fetch();
        } finally {
            self::assertSame(0, $client->getRequestsCount());
        }
    }

    #[DataProvider('failures')]
    public function testTranslatesUpstreamFailuresAndDoesNotCacheThem(MockResponse $response, string $exception): void
    {
        $client = new MockHttpClient([$response, new MockResponse(json_encode(WebcupApiSimulator::samplePayload()))]);
        $gateway = $this->gateway($client);
        try {
            $gateway->fetch();
            self::fail('The failure should be translated.');
        } catch (\Throwable $error) {
            self::assertInstanceOf($exception, $error);
            self::assertStringNotContainsString(self::KEY, $error->getMessage());
        }
        self::assertCount(2, $gateway->fetch()->requests);
        foreach ($this->logs as $log) {
            self::assertStringNotContainsString(self::KEY, $log);
        }
    }

    public static function failures(): iterable
    {
        yield 'key refused' => [new MockResponse('{"message":"forbidden"}', ['http_code' => 403]), WebcupApiKeyRejected::class];
        yield 'server error' => [new MockResponse('oops', ['http_code' => 500]), WebcupFeedUnavailable::class];
        yield 'timeout' => [new MockResponse('', ['error' => 'Idle timeout reached for "' . self::URL . '".']), WebcupFeedUnavailable::class];
        yield 'invalid json' => [new MockResponse('<html>'), WebcupFeedUnavailable::class];
        yield 'unexpected shape' => [new MockResponse('{"foo":1}'), WebcupFeedUnavailable::class];
    }

    private function gateway(MockHttpClient $client, string $key = self::KEY): WebcupHttpFeedGateway
    {
        $clock = new class implements IClock {
            public function now(): \DateTimeImmutable { return new \DateTimeImmutable('2026-10-03T12:00:00+00:00'); }
        };
        $logs = &$this->logs;
        $logger = new class($logs) extends AbstractLogger {
            public function __construct(private array &$logs) {}
            public function log($level, \Stringable|string $message, array $context = []): void { $this->logs[] = $message . json_encode($context); }
        };

        return new WebcupHttpFeedGateway($client, new ArrayAdapter(), $clock, self::URL, $key, $logger);
    }
}
