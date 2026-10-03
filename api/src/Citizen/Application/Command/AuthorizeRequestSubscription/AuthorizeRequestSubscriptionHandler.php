<?php

declare(strict_types=1);
namespace Citizen\Application\Command\AuthorizeRequestSubscription;
use Citizen\Application\Ports\Repository\CitizenRepository;
use Citizen\Application\Ports\Provider\CurrentAccountProvider;
use Citizen\Application\Ports\Provider\RequestAccessPolicy;
use Shared\Application\Ports\Service\RealtimeSubscriptionGrant;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
#[AsMessageHandler]
final readonly class AuthorizeRequestSubscriptionHandler {
 public function __construct(private CitizenRepository $citizens,private CurrentAccountProvider $identity,private RequestAccessPolicy $access,private RealtimeSubscriptionGrant $signer){}
 public function __invoke(AuthorizeRequestSubscriptionCommand $cmd):array {
  $citizen=$this->citizens->findByUserId($this->identity->userId());
  $own=$citizen!==null&&$cmd->topic==='private.citizen.'.$citizen->id.'.requests';
  if(!$own&&!($cmd->topic==='private.agents.requests'&&$this->access->canRead()))throw new AccessDeniedException('Subscription denied.');
  return $this->signer->grant($cmd->topic,$cmd->socketId);
 }
}
