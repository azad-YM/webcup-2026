<?php

declare(strict_types=1);

namespace Citizen\Application\Query\ListCitizenAccounts;

use Citizen\Application\Ports\Provider\CitizenAccountAccessPolicy;
use Citizen\Application\Ports\Provider\CitizenAccountManager;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Service\SensitiveDataDisclosure;
use Citizen\Application\ViewModel\CitizenProfile;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Agents' view of citizen accounts. Deleted (anonymized) accounts are never listed; no secret leaves IAM. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class ListCitizenAccountsHandler
{
    public const LIMIT = 200;

    public function __construct(private CitizenRepository $citizens, private CitizenAccountManager $accounts, private CitizenAccountAccessPolicy $access, private ?SensitiveDataDisclosure $disclosure = null) {}

    public function __invoke(ListCitizenAccountsQuery $query): array
    {
        $canManage = $this->access->canManageAccounts();
        if (!$this->access->canReadAccounts() && !$canManage) throw new AccessDeniedException('Citizen account reading is not allowed.');
        $citizens = $this->citizens->findAccounts();
        $emails = $this->accounts->emails(array_values(array_map(static fn ($citizen) => $citizen->userId, $citizens)));
        $search = $query->search !== null ? mb_strtolower(trim($query->search)) : '';
        $status = in_array($query->status, ['active', 'suspended'], true) ? $query->status : null;
        // F70 : coordonnées et adresse masquées par défaut ; affichées seulement à un agent habilité qui le demande.
        $revealed = $query->reveal && $this->disclosure !== null && $this->disclosure->canReveal();
        $items = [];
        $total = 0;
        foreach ($citizens as $citizen) {
            if ($status !== null && $citizen->status() !== $status) continue;
            $email = $emails[$citizen->userId] ?? null;
            if ($search !== '') {
                $haystack = mb_strtolower(implode(' ', array_filter([$email, $citizen->firstName(), $citizen->lastName(), $revealed ? $citizen->phone() : null, $citizen->district()])));
                if (!str_contains($haystack, $search)) continue;
            }
            ++$total;
            if (count($items) >= self::LIMIT) continue;
            $profile = CitizenProfile::fromCitizen($citizen);
            $items[] = [
                'profile' => $revealed ? $profile : $profile->masked(),
                'email' => $revealed ? $email : SensitiveDataDisclosure::maskEmail($email),
                'maskedFields' => $revealed ? [] : ['email', 'phone', 'address'],
                'status' => $citizen->status(),
                'canSuspend' => $canManage && !$this->access->isProtectedAccount($citizen->userId),
            ];
        }
        if ($revealed) {
            $this->disclosure?->reveal(true, 'citizen-accounts', count($items));
        }

        return ['items' => $items, 'total' => $total, 'canManage' => $canManage, 'sensitive' => $this->disclosure?->meta($revealed) ?? ['revealed' => false, 'canReveal' => false]];
    }
}
