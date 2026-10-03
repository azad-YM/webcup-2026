<?php
namespace Citizen\Infrastructure\Adapter\Communication;
use Communication\Application\Ports\Provider\AudienceProvider;
use Communication\Application\DTO\Audience;
use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceHandler;
use Citizen\Application\Query\GetMyAlertPreference\GetMyAlertPreferenceQuery;
final readonly class CitizenAudienceProvider implements AudienceProvider {
 public function __construct(private GetMyAlertPreferenceHandler $query) {}
 public function current(): Audience { $result=($this->query)(new GetMyAlertPreferenceQuery()); return new Audience($result['citizenId'],$result['district'],$result['healthConsent']); }
}
