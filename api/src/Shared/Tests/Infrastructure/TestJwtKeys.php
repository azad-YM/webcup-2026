<?php

declare(strict_types=1);

namespace Tests\Shared\Infrastructure;

final class TestJwtKeys
{
    private static ?string $directory = null;

    public static function initialize(): void
    {
        if (self::$directory !== null) {
            return;
        }
        self::$directory = sys_get_temp_dir() . '/app-test-jwt-' . bin2hex(random_bytes(8));
        mkdir(self::$directory, 0700);
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        if ($key === false || !openssl_pkey_export($key, $private)) {
            throw new \RuntimeException('Unable to generate test JWT keys.');
        }
        $details = openssl_pkey_get_details($key);
        file_put_contents(self::$directory . '/private.pem', $private);
        file_put_contents(self::$directory . '/public.pem', $details['key']);
        foreach (['JWT_SECRET_KEY' => self::$directory . '/private.pem', 'JWT_PUBLIC_KEY' => self::$directory . '/public.pem', 'JWT_PASSPHRASE' => ''] as $name => $value) {
            $_ENV[$name] = $_SERVER[$name] = $value;
            putenv($name . '=' . $value);
        }
        register_shutdown_function(static function (): void {
            unlink(self::$directory . '/private.pem');
            unlink(self::$directory . '/public.pem');
            rmdir(self::$directory);
        });
    }
}
