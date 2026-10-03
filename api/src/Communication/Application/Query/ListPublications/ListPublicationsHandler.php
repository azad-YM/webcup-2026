<?php
namespace Communication\Application\Query\ListPublications;
use Communication\Application\Ports\Repository\PublicationRepository;
use Communication\Application\Ports\Provider\CommunicationAccessPolicy;
use Communication\Application\Ports\Provider\AudienceProvider;
use Shared\Application\Ports\Service\IClock;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler(bus:'query.bus')]
final readonly class ListPublicationsHandler {
 public function __construct(private PublicationRepository $publications,private CommunicationAccessPolicy $access,private AudienceProvider $audiences,private IClock $clock) {}
 public function __invoke(ListPublicationsQuery $query): array {
  if($query->scope==='admin'&&!$this->access->canPublish()) throw new AccessDeniedException('Permission de publication requise.');
  $audience=$query->scope==='notifications'?$this->audiences->current():null;
  $items=[]; foreach($this->publications->all() as $p) {
   if($query->scope==='admin') {$items[]=$p->view();continue;}
   if(!$p->active($this->clock->now())) continue;
   if($query->scope==='publications'&&$p->data['severity']===null) $items[]=$p->view();
   if($query->scope==='alerts'&&$p->data['severity']!==null&&$p->data['audience']==='all') $items[]=$p->view();
   if($audience&&($p->data['important']||$p->data['severity']!==null)&&$p->matches($audience->district,$audience->healthConsent)) $items[]=$p->view();
  }
  usort($items,fn($a,$b)=>strcmp($b['publishedAt'],$a['publishedAt'])?:strcmp($a['id'],$b['id']));return $items;
 }
}
