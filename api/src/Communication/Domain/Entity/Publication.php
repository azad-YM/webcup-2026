<?php
declare(strict_types=1);
namespace Communication\Domain\Entity;
use Shared\Domain\Model\AggregateRoot;
use Shared\Domain\Exception\DomainException;
use Communication\Domain\Event\PublicationChanged;
final class Publication {
 use AggregateRoot;
 public function __construct(public readonly string $id, public array $data) {}
 public static function save(string $id,array $data,\DateTimeImmutable $now): self {
  if(!preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/',$id)) throw new DomainException('Identifiant invalide.');
  foreach(['title','category','summary'] as $key) if(!is_string($data[$key]??null)||trim($data[$key])===''||mb_strlen($data[$key])>2000) throw new DomainException('Titre, catégorie et résumé requis.');
  if(!is_array($data['body']??null)||!array_is_list($data['body'])||count($data['body'])<1||count($data['body'])>100) throw new DomainException('Contenu requis.');
  foreach($data['body'] as $paragraph) if(!is_string($paragraph)||trim($paragraph)===''||mb_strlen($paragraph)>10000) throw new DomainException('Paragraphe invalide.');
  if(!in_array($data['state']??null,['draft','published','withdrawn'],true)||!is_bool($data['important']??null)) throw new DomainException('État de publication invalide.');
  if(!in_array($data['severity']??null,[null,'info','warning','critical'],true)||!in_array($data['audience']??null,['all','district','health'],true)) throw new DomainException('Gravité ou audience invalide.');
  if($data['audience']==='district'&&!in_array($data['district']??null,['Nord','Sud','Est','Ouest','Centre','Port'],true)) throw new DomainException('Quartier inconnu.');
  if($data['audience']!=='district') $data['district']=null;
  if(($data['severity']??null)!==null) {
   foreach(['startsAt','endsAt'] as $key) { if(!is_string($data[$key]??null)||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/',$data[$key])) throw new DomainException('Dates ISO 8601 requises.'); try { $date=new \DateTimeImmutable($data[$key]); } catch(\Exception) { throw new DomainException('Date invalide.'); } $errors=\DateTimeImmutable::getLastErrors(); if($errors&&($errors['warning_count']||$errors['error_count'])) throw new DomainException('Date invalide.'); $data[$key]=$date->format(DATE_ATOM); }
   if(new \DateTimeImmutable($data['endsAt'])<=new \DateTimeImmutable($data['startsAt'])) throw new DomainException('La fin doit suivre le début.');
  } else { $data['startsAt']=null; $data['endsAt']=null; if($data['audience']!=='all') throw new DomainException('Le ciblage est réservé aux alertes.'); }
  if(!is_string($data['recommendations']??null)||mb_strlen($data['recommendations'])>10000) throw new DomainException('Recommandations invalides.');
  $data['publishedAt']=$now->format(DATE_ATOM);
  $p=new self($id,array_intersect_key($data,array_flip(['title','category','summary','body','state','important','severity','audience','district','startsAt','endsAt','recommendations','publishedAt'])));
  $p->record(new PublicationChanged($id)); return $p;
 }
 public function active(\DateTimeImmutable $now): bool { return $this->data['state']==='published'&&($this->data['severity']===null||($now>=new \DateTimeImmutable($this->data['startsAt'])&&$now<new \DateTimeImmutable($this->data['endsAt']))); }
 public function matches(?string $district,bool $healthConsent): bool { return match($this->data['audience']) {'all'=>true,'district'=>$district===$this->data['district'],'health'=>$healthConsent,default=>false}; }
 public function view(): array { return ['id'=>$this->id,...$this->data]; }
}
