<?php
namespace Administration\Infrastructure\Doctrine\Repository;
use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Domain\Entity\MunicipalService;
use Doctrine\ORM\EntityManagerInterface;
final readonly class DoctrineMunicipalServiceRepository implements MunicipalServiceRepository {
 public function __construct(private EntityManagerInterface $manager) {}
 public function save(MunicipalService $service): void { $existing=$this->manager->find(MunicipalService::class,$service->id); if($existing) $existing->data=$service->data; else $this->manager->persist($service); }
 public function all(): array { return $this->manager->getRepository(MunicipalService::class)->findBy([],['id'=>'ASC']); }
}
