<?php

declare(strict_types=1);

namespace Tests\Shared\Suites\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Application\Listener\ExceptionListener;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\Exception\HandlerFailedException;

#[Group('Unit')]
final class ExceptionListenerTest extends TestCase
{
    public function test_shouldTranslateWrappedAccessDenialToForbidden(): void
    {
        $this->assertStatus(403, new HandlerFailedException(new Envelope(new \stdClass()), [new AccessDeniedException('Denied')]));
    }

    public function test_shouldPreserveValidationStatus(): void
    {
        $this->assertStatus(422, new UnprocessableEntityHttpException('Invalid payload'));
    }

    public function test_shouldKeepUnexpectedErrorsAsServerErrors(): void
    {
        $this->assertStatus(500, new \RuntimeException('Unexpected failure'));
    }

    private function assertStatus(int $status, \Throwable $error): void
    {
        $event = new ExceptionEvent($this->createStub(HttpKernelInterface::class), new Request(), HttpKernelInterface::MAIN_REQUEST, $error);
        (new ExceptionListener())($event);
        self::assertSame($status, $event->getResponse()->getStatusCode());
    }
}
