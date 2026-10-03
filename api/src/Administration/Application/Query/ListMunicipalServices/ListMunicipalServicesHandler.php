<?php
namespace Administration\Application\Query\ListMunicipalServices;
use Administration\Application\Ports\Repository\MunicipalServiceRepository;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'query.bus')]
final readonly class ListMunicipalServicesHandler {
 public function __construct(private MunicipalServiceRepository $services) {}
 public function __invoke(ListMunicipalServicesQuery $query): array { return array_map(fn($s)=>$s->view(),$this->services->all()); }
}
