<?php

declare(strict_types=1);

namespace Tests\Pilotage\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Pilotage\Application\Command\SyncTracking\SyncTrackingCommand;
use Pilotage\Application\Command\SyncTracking\SyncTrackingHandler;
use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Pilotage\Domain\Entity\RequestTracking;
use Shared\Application\Ports\Service\IClock;

#[Group('Unit')]
final class SyncTrackingTest extends TestCase
{
    private RequestTrackingRepository $repository;
    private SyncTrackingHandler $handler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new class implements RequestTrackingRepository {
            public array $rows = [];
            public function find(string $requestCode): ?RequestTracking { return $this->rows[$requestCode] ?? null; }
            public function all(): array { return $this->rows; }
            public function save(RequestTracking $tracking): void { $this->rows[$tracking->requestCode] = $tracking; }
        };
        $clock = new class implements IClock {
            public function now(): \DateTimeImmutable { return new \DateTimeImmutable('2026-10-04T00:00:00Z'); }
        };
        $this->handler = new SyncTrackingHandler($this->repository, $clock);
    }

    public function testPreviewWritesNothingAndApplyIsIdempotent(): void
    {
        $preview = ($this->handler)(new SyncTrackingCommand('https://city.example', 'https://admin.example'));
        self::assertCount(71, $preview);
        self::assertSame([], $this->repository->all());
        $command = new SyncTrackingCommand('https://city.example/', 'https://admin.example/', true);
        self::assertCount(71, ($this->handler)($command));
        $counts = array_count_values(array_map(fn ($row) => $row->status(), $this->repository->all()));
        self::assertSame(46, $counts['done']);
        self::assertSame(3, $counts['in_progress']);
        self::assertSame(22, $counts['todo']);
        self::assertSame('https://city.example/inscription', $this->repository->find('D01')->view()['links'][0]['url']);
        self::assertSame('https://admin.example/pilotage', $this->repository->find('D19')->view()['links'][0]['url']);
        self::assertSame([], ($this->handler)($command));
    }

    public function testPreservesMoreAdvancedAndUnknownRequests(): void
    {
        foreach (['F40', 'F71', 'F99'] as $code) {
            $row = RequestTracking::start($code);
            $row->update('done', [], 'Validation production', new \DateTimeImmutable(), 'agent', 'Agent');
            $this->repository->save($row);
        }
        ($this->handler)(new SyncTrackingCommand('https://city.example', 'https://admin.example', true));
        foreach (['F40', 'F71', 'F99'] as $code) {
            self::assertSame('Validation production', $this->repository->find($code)->view()['note']);
        }
    }

    public function testInvalidUrlDoesNotWriteAnything(): void
    {
        try {
            ($this->handler)(new SyncTrackingCommand('https://city.example', 'https://user:secret@admin.example', true));
            self::fail('Invalid URL accepted');
        } catch (\InvalidArgumentException) {
            self::assertSame([], $this->repository->all());
        }
    }
}
