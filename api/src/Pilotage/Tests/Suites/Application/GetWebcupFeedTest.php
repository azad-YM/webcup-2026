<?php

declare(strict_types=1);

namespace Tests\Pilotage\Suites\Application;

use Administration\Application\Ports\Repository\IRoleRepository;
use Administration\Domain\Entity\Member;
use Administration\Domain\Entity\Role;
use Administration\Domain\VO\Permission;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\HttpClient\Response\MockResponse;
use Tests\Pilotage\Doubles\Http\WebcupApiSimulator;
use Tests\Shared\Fixtures\UserFixture;
use Tests\Shared\Infrastructure\ApplicationTestCase;

/** Real route, firewall, query bus, Administration adapter and HTTP adapter; the contest API is simulated. */
#[Group('Application')]
final class GetWebcupFeedTest extends ApplicationTestCase
{
    private const URI = '/api/pilotage/webcup-feed';
    private const KEY = 'test-webcup-key';

    /** @var array<string, mixed> */
    private array $previousEnv = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->setKey(self::KEY);
        WebcupApiSimulator::reset();
        $this->initialize();
        $owner = new UserFixture();
        $this->load([$owner]);
        $owner->authenticate(self::$client);
    }

    protected function tearDown(): void
    {
        foreach (['_ENV', '_SERVER'] as $scope) {
            if (array_key_exists($scope, $this->previousEnv) && $this->previousEnv[$scope] !== null) {
                $GLOBALS[$scope]['WEBCUP_API_KEY'] = $this->previousEnv[$scope];
            } else {
                unset($GLOBALS[$scope]['WEBCUP_API_KEY']);
            }
        }
        WebcupApiSimulator::reset();
        parent::tearDown();
    }

    public function testAgentReadsTheNormalizedFeed(): void
    {
        $this->member([new Permission('admin', 'pilotage', 'read')]);
        WebcupApiSimulator::respondJson(WebcupApiSimulator::samplePayload());

        $this->request('GET', self::URI);

        self::assertResponseStatusCodeSame(200);
        $body = json_decode(self::$client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame(['D01', 'F21'], array_column($body['requests'], 'requestCode'));
        self::assertSame(['currentWave' => 3, 'nextWaveNumber' => 4, 'minutesUntilNextWave' => 19, 'requestsCount' => 2, 'totalXpAvailable' => 770], array_intersect_key($body['session'], array_flip(['currentWave', 'nextWaveNumber', 'minutesUntilNextWave', 'requestsCount', 'totalXpAvailable'])));
        self::assertSame('Premiers habitants', $body['requests'][1]['groupName']);
        self::assertNotEmpty($body['fetchedAt']);
        $calls = WebcupApiSimulator::calls();
        self::assertCount(1, $calls);
        self::assertSame('https://24h.webcup.fr/wp-json/webcup/v1/requests', $calls[0]['url']);
        self::assertContains('X-Webcup-Api-Key: ' . self::KEY, $calls[0]['headers']);
        self::assertStringNotContainsString(self::KEY, self::$client->getResponse()->getContent());
    }

    public function testRefusedKeyBecomesBadGateway(): void
    {
        $this->member([new Permission('admin', 'pilotage', 'read')]);
        WebcupApiSimulator::respond(new MockResponse('{"code":"forbidden"}', ['http_code' => 403]));
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(502);
        $body = json_decode(self::$client->getResponse()->getContent(), true);
        self::assertSame('webcup_api_key_rejected', $body['code']);
        self::assertSame('Clé refusée par l’API du concours.', $body['message']);
        self::assertStringNotContainsString(self::KEY, self::$client->getResponse()->getContent());
    }

    public function testUpstreamOutageBecomesBadGateway(): void
    {
        $this->member([new Permission('admin', 'pilotage', 'read')]);
        WebcupApiSimulator::respond(new MockResponse('', ['error' => 'Connection timed out']));
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(502);
        self::assertSame('webcup_feed_unavailable', json_decode(self::$client->getResponse()->getContent(), true)['code']);
    }

    public function testMissingKeyBecomesServiceUnavailableWithoutCallingTheApi(): void
    {
        $this->setKey('');
        $this->member([new Permission('admin', 'pilotage', 'read')]);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(503);
        self::assertSame('webcup_api_key_missing', json_decode(self::$client->getResponse()->getContent(), true)['code']);
        self::assertSame([], WebcupApiSimulator::calls());
    }

    public function testMemberWithoutPilotagePermissionIsRefusedWithoutCallingTheApi(): void
    {
        $this->member([new Permission('admin', 'role', 'read')]);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
        self::assertSame([], WebcupApiSimulator::calls());
    }

    public function testInactiveMemberIsRefused(): void
    {
        $this->member([new Permission('admin', 'pilotage', 'read')], active: false);
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    public function testAccountWithoutMembershipIsRefused(): void
    {
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(403);
    }

    public function testAnonymousIsRejected(): void
    {
        self::$client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->request('GET', self::URI);
        self::assertResponseStatusCodeSame(401);
        self::assertSame([], WebcupApiSimulator::calls());
    }

    /** @param Permission[] $permissions */
    private function member(array $permissions, bool $active = true): void
    {
        self::getContainer()->get(IRoleRepository::class)->save(new Role('pilotage-role', 'Agent', $permissions));
        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $manager->persist(new Member('member', 'test-user', 'Agent', ['pilotage-role'], $active));
        $manager->flush();
    }

    private function setKey(string $key): void
    {
        foreach (['_ENV', '_SERVER'] as $scope) {
            if (!array_key_exists($scope, $this->previousEnv)) {
                $this->previousEnv[$scope] = $GLOBALS[$scope]['WEBCUP_API_KEY'] ?? null;
            }
            $GLOBALS[$scope]['WEBCUP_API_KEY'] = $key;
        }
    }
}
