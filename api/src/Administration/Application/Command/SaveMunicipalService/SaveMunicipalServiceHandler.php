<?php
namespace Administration\Application\Command\SaveMunicipalService;
use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Administration\Domain\Entity\MunicipalService;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'command.bus')]
final readonly class SaveMunicipalServiceHandler {
 public function __construct(private MunicipalServiceRepository $services,private CheckCurrentMemberPermissionsHandler $permissions) {}
 public function __invoke(SaveMunicipalServiceCommand $cmd): void {
  if(!($this->permissions)(new CheckCurrentMemberPermissionsQuery(['admin.service.write']))) throw new AccessDeniedException('Permission de gestion des services requise.');
  $this->services->save(MunicipalService::save($cmd->id,get_object_vars($cmd)));
 }
}
