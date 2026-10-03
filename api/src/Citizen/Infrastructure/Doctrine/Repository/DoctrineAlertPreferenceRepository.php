<?php
namespace Citizen\Infrastructure\Doctrine\Repository;
use Citizen\Application\Ports\Repository\AlertPreferenceRepository;
use Citizen\Domain\Entity\AlertPreference;
use Doctrine\ORM\EntityManagerInterface;
final readonly class DoctrineAlertPreferenceRepository implements AlertPreferenceRepository {
 public function __construct(private EntityManagerInterface $manager) {}
 public function get(string $citizenId): AlertPreference { return $this->manager->find(AlertPreference::class,$citizenId)??new AlertPreference($citizenId); }
 public function save(AlertPreference $preference): void { $this->manager->persist($preference); }
}
