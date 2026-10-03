<?php

declare(strict_types=1);

namespace Communication\Infrastructure\Adapter\Pilotage;

use Doctrine\ORM\EntityManagerInterface;
use Pilotage\Application\DTO\Activity\CommunicationActivity;
use Pilotage\Application\Ports\Provider\Activity\CommunicationActivityProvider;

/** Port of the Pilotage dashboard implemented by Communication: counts on its own tables only. */
final readonly class CommunicationPilotageActivity implements CommunicationActivityProvider
{
    public function __construct(private EntityManagerInterface $manager) {}

    public function communicationActivity(\DateTimeImmutable $now): CommunicationActivity
    {
        $db = $this->manager->getConnection();
        $at = $now->format('Y-m-d H:i:s');
        $alerts = $db->fetchAssociative(
            "SELECT SUM(starts_at <= ? AND ends_at > ?) AS active, SUM(starts_at <= ? AND ends_at > ? AND severity = 'critical') AS critical, SUM(starts_at > ?) AS scheduled
             FROM communication_alert WHERE state = 'published'",
            [$at, $at, $at, $at, $at],
        ) ?: [];
        $publications = $db->fetchAssociative(
            "SELECT SUM(state = 'published') AS published, SUM(state = 'draft') AS drafts FROM communication_publication",
        ) ?: [];

        return new CommunicationActivity(
            (int) ($alerts['active'] ?? 0),
            (int) ($alerts['critical'] ?? 0),
            (int) ($alerts['scheduled'] ?? 0),
            (int) ($publications['published'] ?? 0),
            (int) ($publications['drafts'] ?? 0),
        );
    }
}
