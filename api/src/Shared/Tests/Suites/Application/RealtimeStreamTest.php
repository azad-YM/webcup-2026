<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Application;

use Citizen\Domain\Entity\Citizen;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Shared\Application\Ports\Service\RealtimePublisher;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

/**
 * Transport `database` end to end: publisher → realtime_event → SSE stream, with server-side topics
 * (public for everyone, private through a ticket) and resumption from Last-Event-ID.
 * Cross-BC scenario: the Citizen audience provider grants `citizen.{id}`.
 */
#[Group('Application')]
final class RealtimeStreamTest extends ApplicationTestCase
{
    private UserFixture $citizenAccount;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialize();
        $this->citizenAccount = new UserFixture('citizen-user', 'citizen@example.com');
        $this->load([$this->citizenAccount]);
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Citizen('citizen-id', 'citizen-user', new \DateTimeImmutable('2026-10-03T14:30:00+00:00')));
        $manager->flush();
        $manager->clear();
    }

    public function test_shouldStreamPublicEventsToAnonymousVisitors(): void
    {
        $this->publish('public.alerts', 'alert.published', ['alertId' => 'a1']);

        $body = $this->stream('/api/realtime/stream?lastEventId=0');

        self::assertResponseStatusCodeSame(200);
        self::assertStringStartsWith('text/event-stream', (string) self::$client->getResponse()->headers->get('Content-Type'));
        self::assertSame('no', self::$client->getResponse()->headers->get('X-Accel-Buffering'));
        self::assertStringContainsString("event: alert.published\n", $body);
        preg_match('/^data: (.+)$/m', $body, $data);
        self::assertSame(['alertId' => 'a1'], json_decode($data[1], true, flags: JSON_THROW_ON_ERROR));
        self::assertMatchesRegularExpression('/^id: \d+$/m', $body);
    }

    public function test_shouldOnlyDeliverWhatHappensAfterANewConnection(): void
    {
        $this->publish('public.alerts', 'alert.published', ['alertId' => 'old']);

        $body = $this->stream('/api/realtime/stream');

        self::assertStringNotContainsString('old', $body);
        self::assertStringContainsString(': connected', $body);
    }

    public function test_shouldResumeAfterTheLastEventId(): void
    {
        $this->publish('public.alerts', 'alert.published', ['alertId' => 'first']);
        $first = $this->lastEventId($this->stream('/api/realtime/stream?lastEventId=0'));
        $this->publish('public.alerts', 'alert.published', ['alertId' => 'second']);

        $body = $this->stream('/api/realtime/stream', ['HTTP_LAST_EVENT_ID' => (string) $first]);

        self::assertStringNotContainsString('first', $body);
        self::assertStringContainsString('second', $body);
    }

    public function test_shouldNeverStreamPrivateTopicsWithoutTicket(): void
    {
        $this->publish('citizen.citizen-id', 'request.status_changed', ['requestId' => 'r1']);

        $body = $this->stream('/api/realtime/stream?lastEventId=0&topic=citizen.citizen-id');

        self::assertStringNotContainsString('r1', $body);
    }

    public function test_shouldStreamTheCitizenOwnPrivateTopicWithATicket(): void
    {
        $this->publish('citizen.citizen-id', 'request.status_changed', ['requestId' => 'mine']);
        $this->publish('citizen.someone-else', 'request.status_changed', ['requestId' => 'theirs']);
        $this->citizenAccount->authenticate(self::$client);
        $this->request('POST', '/api/realtime/tickets');
        self::assertResponseStatusCodeSame(200);
        $ticket = json_decode((string) self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR)['ticket'];
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');

        $body = $this->stream('/api/realtime/stream?lastEventId=0&ticket=' . rawurlencode($ticket));

        self::assertStringContainsString('mine', $body);
        self::assertStringNotContainsString('theirs', $body);
    }

    public function test_shouldRejectAnonymousTicketRequestsAndInvalidTickets(): void
    {
        $this->request('POST', '/api/realtime/tickets');
        self::assertResponseStatusCodeSame(401);

        self::$client->request('GET', '/api/realtime/stream?ticket=forged.ticket');
        self::assertResponseStatusCodeSame(401);
    }

    /** @param array<string, string> $payload */
    private function publish(string $topic, string $event, array $payload): void
    {
        self::getContainer()->get(RealtimePublisher::class)->publish($topic, $event, $payload);
    }

    /** @param array<string, string> $server */
    private function stream(string $uri, array $server = []): string
    {
        self::$client->request('GET', $uri, server: $server + ['HTTP_ACCEPT' => 'text/event-stream']);

        return (string) self::$client->getInternalResponse()->getContent();
    }

    private function lastEventId(string $body): int
    {
        preg_match_all('/^id: (\d+)$/m', $body, $ids);

        return (int) end($ids[1]);
    }
}
