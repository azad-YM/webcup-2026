<?php
declare(strict_types=1);
namespace Administration\Domain\Entity;
use Shared\Domain\Exception\DomainException;
final class MunicipalService {
 public const CATEGORIES=['demarches','cadre-de-vie','sante-solidarite','mobilite','habitat','famille'];
 public function __construct(public readonly string $id, public array $data) {}
 public static function save(string $id,array $data): self {
  if (!preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/',$id)) throw new DomainException('Identifiant de service invalide.');
  foreach (['name','summary','description'] as $key) if (!is_string($data[$key]??null)||trim($data[$key])===''||mb_strlen($data[$key])>10000) throw new DomainException('Nom, résumé et description requis (10 000 caractères maximum).');
  if (!in_array($data['category']??null,self::CATEGORIES,true)) throw new DomainException('Catégorie inconnue.');
  foreach (['actions','keywords'] as $key) { if (!is_array($data[$key]??null)||!array_is_list($data[$key])||count($data[$key])>50) throw new DomainException('Liste invalide.'); foreach($data[$key] as $item) if (!is_string($item)||mb_strlen($item)>1000) throw new DomainException('Texte de liste invalide.'); }
  foreach (['place','hours'] as $key) if(!is_string($data['contact'][$key]??null)||mb_strlen($data['contact'][$key])>1000) throw new DomainException('Coordonnées invalides.');
  if(isset($data['contact']['phone'])&&(!is_string($data['contact']['phone'])||strlen($data['contact']['phone'])>100)) throw new DomainException('Téléphone invalide.');
  if(!is_bool($data['featured']??null)) throw new DomainException('Mise en avant invalide.');
  $data['status']=$data['status']??'operational'; $data['statusMessage']=$data['statusMessage']??'';
  if (!in_array($data['status'],['operational','maintenance','interrupted'],true)||!is_string($data['statusMessage'])||mb_strlen($data['statusMessage'])>2000) throw new DomainException('État invalide.');
  if($data['status']!=='operational'&&trim($data['statusMessage'])==='') throw new DomainException('Précisez la perturbation du service.');
  $data['transport']=$data['transport']??null;
  if($data['transport']!==null) { if($data['category']!=='mobilite'||!is_array($data['transport'])) throw new DomainException('Les horaires concernent un service de mobilité.'); foreach(['route','timetable','information'] as $key) if(!is_string($data['transport'][$key]??null)||mb_strlen($data['transport'][$key])>5000) throw new DomainException('Informations transport invalides.'); if(trim($data['transport']['route'])===''||trim($data['transport']['timetable'])==='') throw new DomainException('Trajet et horaires requis.'); }
  return new self($id,array_intersect_key($data,array_flip(['name','category','summary','description','actions','contact','featured','keywords','status','statusMessage','transport'])));
 }
 public function view(): array { return ['id'=>$this->id,...$this->data]; }
}
