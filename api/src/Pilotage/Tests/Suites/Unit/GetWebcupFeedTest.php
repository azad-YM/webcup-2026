<?php

declare(strict_types=1);

namespace Tests\Pilotage\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Pilotage\Application\Exception\WebcupApiKeyMissing;
use Pilotage\Application\Query\GetWebcupFeed\GetWebcupFeedHandler;
use Pilotage\Application\Query\GetWebcupFeed\GetWebcupFeedQuery;
use Pilotage\Domain\Model\WebcupFeed;
use Pilotage\Domain\Model\WebcupRequest;
use Pilotage\Domain\Model\WebcupSession;
use Shared\Domain\Exception\AccessDeniedException;
use Tests\Pilotage\Doubles\Gateway\StubWebcupFeedGateway;
use Tests\Pilotage\Doubles\Provider\StubPilotageAccessPolicy;

#[Group('Unit')]
final class GetWebcupFeedTest extends TestCase
{
    public function testReturnsSessionAndRequestsSortedBySortOrder(): void
    {
        $feed = new WebcupFeed(new WebcupSession('running', true, 3, 281, 3, 4, 19), [
            $this->request('F21', 11, xpTotal: 520, xpAvailable: 520),
            $this->request('X99', null, xpTotal: 100, xpAvailable: null),
            $this->request('D01', 1, xpTotal: 250, xpAvailable: 0),
        ], new \DateTimeImmutable('2026-10-03T14:00:00+00:00'));

        $result = (new GetWebcupFeedHandler(new StubPilotageAccessPolicy(), new StubWebcupFeedGateway($feed)))(new GetWebcupFeedQuery());

        self::assertSame(['D01', 'F21', 'X99'], array_column($result['requests'], 'requestCode'));
        self::assertSame(3, $result['session']['currentWave']);
        self::assertSame(19, $result['session']['minutesUntilNextWave']);
        self::assertTrue($result['session']['hasNextWave']);
        self::assertSame(3, $result['session']['requestsCount']);
        self::assertSame(620, $result['session']['totalXpAvailable']);
        self::assertSame('2026-10-03T14:00:00+00:00', $result['fetchedAt']);
        self::assertSame(['requestCode', 'requesterName', 'requesterType', 'messagePublic', 'difficulty', 'difficultyLevel', 'xpBase', 'xpTimeBonus', 'xpTotal', 'xpAvailable', 'isInitial', 'waveNumber', 'arrivalTime', 'groupName', 'isAiRequest', 'sortOrder'], array_keys($result['requests'][0]));
    }

    public function testNoNextWaveWhenTheApiAnnouncesZeroMinutes(): void
    {
        $feed = new WebcupFeed(new WebcupSession('finished', false, 6, 1440, 0, null, 0), [], new \DateTimeImmutable());
        $result = (new GetWebcupFeedHandler(new StubPilotageAccessPolicy(), new StubWebcupFeedGateway($feed)))(new GetWebcupFeedQuery());
        self::assertFalse($result['session']['hasNextWave']);
        self::assertSame([], $result['requests']);
        self::assertSame(0, $result['session']['totalXpAvailable']);
    }

    public function testRefusesWithoutCallingTheApiWhenAccessIsDenied(): void
    {
        $gateway = new StubWebcupFeedGateway(new WebcupFeed(new WebcupSession(null, false, null, null, null, null, null), [], new \DateTimeImmutable()));
        try {
            (new GetWebcupFeedHandler(new StubPilotageAccessPolicy(false), $gateway))(new GetWebcupFeedQuery());
            self::fail('Access should be denied.');
        } catch (AccessDeniedException) {
            self::assertSame(0, $gateway->calls);
        }
    }

    public function testPropagatesContractualGatewayErrors(): void
    {
        $this->expectException(WebcupApiKeyMissing::class);
        (new GetWebcupFeedHandler(new StubPilotageAccessPolicy(), new StubWebcupFeedGateway(new WebcupApiKeyMissing())))(new GetWebcupFeedQuery());
    }

    private function request(string $code, ?int $sortOrder, int $xpTotal, ?int $xpAvailable): WebcupRequest
    {
        return new WebcupRequest($code, 'Mairie', 'Administration', 'Besoin', 'Facile', 1, $xpTotal, 0, $xpTotal, $xpAvailable, false, 1, '02:00:00', 'Groupe', false, $sortOrder);
    }
}
