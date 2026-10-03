<?php
namespace Communication\Application\Command\SavePublication;
use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Domain\Entity\Publication;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'command.bus')]
final readonly class SavePublicationHandler {
 public function __construct(private PublicationRepository $publications,private CommunicationAccessPolicy $access,private IClock $clock) {}
 public function __invoke(SavePublicationCommand $cmd): void { if(!$this->access->canPublish()) throw new AccessDeniedException('Permission de publication requise.'); $this->publications->save(Publication::save($cmd->id,get_object_vars($cmd),$this->clock->now())); }
}
