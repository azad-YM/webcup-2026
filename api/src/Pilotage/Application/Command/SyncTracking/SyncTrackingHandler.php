<?php

declare(strict_types=1);

namespace Pilotage\Application\Command\SyncTracking;

use Pilotage\Application\Ports\Repository\RequestTrackingRepository;
use Pilotage\Application\Service\TrackingSnapshot;
use Pilotage\Domain\Entity\RequestTracking;
use Shared\Application\Ports\Service\IClock;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Operational CLI import: no HTTP endpoint, authorization is server console access. */
#[AsMessageHandler(bus: 'command.bus')]
final readonly class SyncTrackingHandler
{
    public function __construct(private RequestTrackingRepository $trackings, private IClock $clock) {}

    public function __invoke(SyncTrackingCommand $command): array
    {
        $urls = ['site' => $this->baseUrl($command->siteUrl), 'admin' => $this->baseUrl($command->adminUrl)];
        $changes = [];
        $pending = [];
        foreach (TrackingSnapshot::ROWS as [$code, $status, $note, $app, $path]) {
            $existing = $this->trackings->find($code);
            $before = $existing?->view();
            // Never undo progress made in production after this snapshot.
            $rank = ['todo' => 0, 'in_progress' => 1, 'done' => 2];
            if ($before !== null && $rank[$before['status']] > $rank[$status]) {
                continue;
            }
            $links = $app === '' ? [] : [['label' => 'Ouvrir la fonctionnalité', 'url' => $urls[$app].$path]];
            // MySQL JSON can reorder object keys; compare link values, not key order.
            if ($before !== null && $before['status'] === $status && $before['note'] === $note && $before['links'] == $links) {
                continue;
            }
            // Validate the entire batch before touching managed entities, even in preview mode.
            $candidate = RequestTracking::start($code);
            $candidate->update($status, $links, $note, $this->clock->now(), null, 'Synchronisation chantier CLI');
            $pending[] = [$existing, $candidate];
            $changes[] = [$code, $before['status'] ?? 'absent', $status, $note, $links[0]['url'] ?? '—'];
        }
        if ($command->apply) {
            foreach ($pending as [$existing, $candidate]) {
                if ($existing !== null) {
                    $view = $candidate->view();
                    $existing->update($view['status'], $view['links'], $view['note'], $this->clock->now(), null, 'Synchronisation chantier CLI');
                }
                $this->trackings->save($existing ?? $candidate);
            }
        }

        return $changes;
    }

    private function baseUrl(string $url): string
    {
        $url = rtrim(trim($url), '/');
        $parts = parse_url($url);
        if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array($parts['scheme'] ?? '', ['http', 'https'], true)
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
            throw new \InvalidArgumentException('Les URL site et admin doivent être des URL HTTP(S), sans identifiants, paramètres ni fragment.');
        }

        return $url;
    }
}
