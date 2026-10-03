<?php

declare(strict_types=1);

namespace Audit\Application\Query\ListAuditEntries;

use Audit\Application\Ports\Provider\AuditAccessPolicy;
use Audit\Application\Ports\Repository\AuditEntryRepository;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListAuditEntriesHandler
{
    public const LIMIT = 200;
    /** Blocked logins expose an e-mail and an IP: same audience as the login security journal. */
    public const SECURITY_PREFIXES = ['iam.login.'];

    public function __construct(
        private AuditAccessPolicy $access,
        private AuditEntryRepository $entries,
    ) {}

    /** @return array{items: list<array<string, mixed>>, limit: int, facets: array<string, mixed>} */
    public function __invoke(ListAuditEntriesQuery $query): array
    {
        if (!$this->access->canReadAuditTrail()) {
            throw new AccessDeniedException('The action journal requires the admin.audit.read permission.');
        }
        $hidden = $this->access->canReadSecurityEntries() ? [] : self::SECURITY_PREFIXES;
        $filters = new AuditFilters(
            self::text($query->actor, 36),
            self::text($query->action, 80),
            self::text($query->category, 40),
            self::day($query->from, 'from'),
            self::day($query->to, 'to')?->modify('+1 day'),
            self::text($query->search, 100),
        );

        return [
            'items' => $this->entries->search($filters, $hidden, self::LIMIT),
            'limit' => self::LIMIT,
            'facets' => $this->entries->facets($hidden),
        ];
    }

    private static function text(?string $value, int $max): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : mb_substr($value, 0, $max);
    }

    private static function day(?string $value, string $name): ?\DateTimeImmutable
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        $day = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if ($day === false) {
            throw new DomainException(sprintf('Invalid "%s" date: expected YYYY-MM-DD.', $name));
        }

        return $day;
    }
}
