<?php

declare(strict_types=1);

namespace Shared\Infrastructure\Doctrine;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\ConversionException;
use Doctrine\DBAL\Types\Type;

/**
 * F69 (ADR 007) : chiffrement au repos d'un champ texte sensible (téléphone, adresse…) avec libsodium
 * (`crypto_secretbox`, XSalsa20-Poly1305 authentifié, nonce aléatoire par valeur).
 *
 * Stockage : `enc:v1:` + base64(nonce ‖ texte chiffré). Une valeur sans ce préfixe est lue telle quelle (donnée
 * antérieure au chiffrement) et sera chiffrée à sa prochaine écriture ; la migration `Version20261003120300`
 * chiffre l'existant. La clé est fournie au démarrage du kernel (`DATA_ENCRYPTION_KEY`, à défaut dérivée de
 * `APP_SECRET`). Conséquence : pas de recherche SQL (`LIKE`, index) sur ces colonnes, le filtrage se fait en PHP.
 */
final class EncryptedStringType extends Type
{
    public const NAME = 'encrypted_string';
    public const PREFIX = 'enc:v1:';

    private static ?string $key = null;

    /** Clé brute de 32 octets (`SODIUM_CRYPTO_SECRETBOX_KEYBYTES`). */
    public static function useKey(string $key): void
    {
        if (strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new \InvalidArgumentException('The data encryption key must be 32 bytes long.');
        }
        self::$key = $key;
    }

    /**
     * `DATA_ENCRYPTION_KEY` : 32 octets en base64 (`php -r "echo base64_encode(random_bytes(32));"`) ;
     * vide → clé dérivée de `APP_SECRET` (développement). Toute autre chaîne est condensée en 32 octets.
     */
    public static function deriveKey(string $configured, string $appSecret): string
    {
        $configured = trim($configured);
        if ($configured === '') {
            return sodium_crypto_generichash('nova-terra:data-encryption:' . $appSecret, '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
        }
        $decoded = base64_decode($configured, true);

        return $decoded !== false && strlen($decoded) === SODIUM_CRYPTO_SECRETBOX_KEYBYTES
            ? $decoded
            : sodium_crypto_generichash($configured, '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
    }

    public static function encrypt(string $plain): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        return self::PREFIX . base64_encode($nonce . sodium_crypto_secretbox($plain, $nonce, self::key()));
    }

    public static function decrypt(string $stored): string
    {
        if (!str_starts_with($stored, self::PREFIX)) {
            return $stored;
        }
        $raw = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if ($raw === false || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new \RuntimeException('Encrypted value is malformed.');
        }
        $plain = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), self::key());
        if ($plain === false) {
            throw new \RuntimeException('Encrypted value cannot be decrypted with the configured key.');
        }

        return $plain;
    }

    public static function isEncrypted(?string $stored): bool
    {
        return $stored !== null && str_starts_with($stored, self::PREFIX);
    }

    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getStringTypeDeclarationSQL($column);
    }

    public function convertToDatabaseValue(mixed $value, AbstractPlatform $platform): ?string
    {
        if ($value === null) {
            return null;
        }
        if (!is_string($value)) {
            throw ConversionException::conversionFailedInvalidType($value, self::NAME, ['null', 'string']);
        }

        // La valeur PHP est toujours en clair (déchiffrée à la lecture) : elle est chiffrée à chaque écriture.
        return self::encrypt($value);
    }

    public function convertToPHPValue(mixed $value, AbstractPlatform $platform): ?string
    {
        if ($value === null) {
            return null;
        }
        try {
            return self::decrypt((string) $value);
        } catch (\RuntimeException $exception) {
            throw ConversionException::conversionFailed('[encrypted]', self::NAME, $exception);
        }
    }

    public function getName(): string
    {
        return self::NAME;
    }

    public function requiresSQLCommentHint(AbstractPlatform $platform): bool
    {
        return true;
    }

    private static function key(): string
    {
        return self::$key ?? throw new \LogicException('The data encryption key is not configured (kernel not booted).');
    }
}
