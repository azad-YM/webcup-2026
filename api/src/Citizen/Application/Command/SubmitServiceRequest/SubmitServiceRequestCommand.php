<?php

declare(strict_types=1);
namespace Citizen\Application\Command\SubmitServiceRequest;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class SubmitServiceRequestCommand {
 public function __construct(#[Assert\Choice(['contact','report'])] public string $type,#[Assert\NotBlank] #[Assert\Length(max:160)] public string $subject,#[Assert\NotBlank] #[Assert\Length(max:5000)] public string $description,#[Assert\Length(max:255)] public ?string $location=null,#[Assert\Length(max:100)] public ?string $serviceId=null){}
}
