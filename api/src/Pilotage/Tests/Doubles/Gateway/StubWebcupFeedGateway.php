<?php

declare(strict_types=1);

namespace Tests\Pilotage\Doubles\Gateway;

use Pilotage\Application\Ports\Gateway\WebcupFeedGateway;
use Pilotage\Domain\Model\WebcupFeed;

final class StubWebcupFeedGateway implements WebcupFeedGateway
{
    public int $calls = 0;

    public function __construct(private WebcupFeed|\Throwable $result) {}

    public function fetch(): WebcupFeed
    {
        ++$this->calls;
        if ($this->result instanceof \Throwable) {
            throw $this->result;
        }

        return $this->result;
    }
}
