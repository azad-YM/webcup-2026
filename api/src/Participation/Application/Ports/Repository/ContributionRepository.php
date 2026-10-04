<?php

declare(strict_types=1);

namespace Participation\Application\Ports\Repository;

use Participation\Domain\Entity\Contribution;

interface ContributionRepository
{
    public function save(Contribution $contribution): void;

    public function findFor(string $consultationId, string $citizenId): ?Contribution;

    /** @return list<Contribution> most recent first */
    public function findByCitizen(string $citizenId): array;

    /** @return list<Contribution> oldest first */
    public function findByConsultation(string $consultationId): array;

    public function countByConsultation(string $consultationId): int;

    /**
     * Aggregated answers, per consultation id.
     *
     * @param list<string> $consultationIds
     * @return array<string, array{total: int, choices: array<string, int>, ratings: array<string, int>, comments: int}>
     */
    public function tally(array $consultationIds): array;

    /** Account deletion: every contribution of the citizen is erased. */
    public function eraseByCitizen(string $citizenId): void;
}
