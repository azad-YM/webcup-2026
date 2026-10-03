<?php
namespace Communication\Infrastructure\Doctrine\Repository;
use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Domain\Entity\Publication;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
final readonly class DoctrinePublicationRepository implements PublicationRepository {
 public function __construct(private EntityManagerInterface $manager,private MessageBusInterface $eventBus) {}
 public function save(Publication $publication): void { $existing=$this->manager->find(Publication::class,$publication->id); if($existing) { $data=$publication->data; $data['publishedAt']=$existing->data['publishedAt']; $existing->data=$data; } else $this->manager->persist($publication); foreach($publication->pullDomainEvents() as $event) $this->eventBus->dispatch($event); }
 public function all(): array { return $this->manager->getRepository(Publication::class)->findBy([],['id'=>'ASC']); }
}
