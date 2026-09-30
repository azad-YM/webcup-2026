<?php

declare(strict_types=1);

require dirname(__DIR__, 3) . '/vendor/autoload.php';

// Tests never inherit database credentials or JWT keys from a developer's .env.
foreach ([
    'APP_ENV' => 'test',
    'APP_DEBUG' => '1',
    'APP_SECRET' => 'app-tests-only',
    'KERNEL_CLASS' => Shared\Infrastructure\Kernel::class,
    'DATABASE_URL' => 'mysql://unused:unused@127.0.0.1:1/unused',
    'MESSENGER_TRANSPORT_DSN' => 'in-memory://',
    'MAILER_DSN' => 'null://null',
    'CORS_ALLOW_ORIGIN' => '^https?://localhost$',
] as $name => $value) {
    $_SERVER[$name] = $_ENV[$name] = $value;
    putenv($name . '=' . $value);
}
