<?php

declare(strict_types=1);
namespace Citizen\Domain\Entity;
use Citizen\Domain\Event\ServiceRequestChanged;
use Shared\Domain\Model\AggregateRoot;
class ServiceRequest {
 use AggregateRoot;
 private string $status='submitted';
 private array $steps=[];
 private int $version=1;
 private const NEXT=['submitted'=>['acknowledged','rejected'],'acknowledged'=>['in_progress','rejected'],'in_progress'=>['resolved','rejected'],'resolved'=>[],'rejected'=>[]];
 public function __construct(public readonly string $id,public readonly string $citizenId,public readonly string $reference,public readonly string $type,public readonly string $subject,public readonly string $description,public readonly ?string $location,public readonly ?string $serviceId,public readonly \DateTimeImmutable $createdAt) {}
 public static function submit(string $id,string $citizenId,string $type,string $subject,string $description,?string $location,?string $serviceId,\DateTimeImmutable $at):self {
  $subject=trim($subject);$description=trim($description);$location=trim($location??'')?:null;$serviceId=trim($serviceId??'')?:null;
  if(!in_array($type,['contact','report'],true)||$subject===''||mb_strlen($subject)>160||$description===''||mb_strlen($description)>5000||mb_strlen($location??'')>255||mb_strlen($serviceId??'')>100) throw new \DomainException('Invalid request.');
  if($type==='report'&&$location===null) throw new \DomainException('A report requires a location.');
  $request=new self($id,$citizenId,'NT-'.$at->format('Y').'-'.strtoupper(str_replace('-','',$id)),$type,$subject,$description,$location,$serviceId,$at);
  $request->steps[]=['status'=>'submitted','at'=>$at->format(DATE_ATOM),'comment'=>null];$request->record(new ServiceRequestChanged($id,$citizenId,'submitted'));return $request;
 }
 public function transition(string $status,?string $comment,\DateTimeImmutable $at):void {
  $comment=trim($comment??'')?:null;
  if(!in_array($status,self::NEXT[$this->status],true)||mb_strlen($comment??'')>2000||($status==='rejected'&&$comment===null)) throw new \DomainException('Invalid status transition or missing rejection reason.');
  $this->status=$status;$this->steps[]=['status'=>$status,'at'=>$at->format(DATE_ATOM),'comment'=>$comment];$this->record(new ServiceRequestChanged($this->id,$this->citizenId,$status));
 }
 public function status():string{return $this->status;}
 public function steps():array{return $this->steps;}
 public function view():array{return ['id'=>$this->id,'reference'=>$this->reference,'type'=>$this->type,'subject'=>$this->subject,'description'=>$this->description,'location'=>$this->location,'serviceId'=>$this->serviceId,'status'=>$this->status,'steps'=>$this->steps,'createdAt'=>$this->createdAt->format(DATE_ATOM),'allowedStatuses'=>self::NEXT[$this->status]];}
}
