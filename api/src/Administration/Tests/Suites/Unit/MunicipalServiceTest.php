<?php
namespace Tests\Administration\Suites\Unit;
use Administration\Domain\Entity\MunicipalService;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\DomainException;
#[Group('Unit')]
final class MunicipalServiceTest extends TestCase {
 public function testRequiresExplanationForInterruption(): void {
  $this->expectException(DomainException::class);
  MunicipalService::save('water', ['name'=>'Eau','category'=>'cadre-de-vie','summary'=>'Eau potable','description'=>'Distribution','actions'=>['Contacter'],'contact'=>['place'=>'Centre','hours'=>'8h'],'featured'=>true,'keywords'=>[], 'status'=>'interrupted','statusMessage'=>'']);
 }
 public function testPreservesTransportInformation(): void {
  $s=MunicipalService::save('bus', ['name'=>'Navette','category'=>'mobilite','summary'=>'Navettes','description'=>'Navettes municipales','actions'=>['Voyager'],'contact'=>['place'=>'Port','hours'=>'8h'],'featured'=>false,'keywords'=>[], 'transport'=>['route'=>'Centre — Port','timetable'=>'Toutes les 30 minutes','information'=>'Accessible']]);
  self::assertSame('Centre — Port',$s->view()['transport']['route']);
  self::assertSame('operational',$s->view()['status']);
 }
}
