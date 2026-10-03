<?php

declare(strict_types=1);
namespace Citizen\Application\Command\ChangeRequestStatus;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class ChangeRequestStatusCommand {
 public function __construct(#[Assert\NotBlank] public string $requestId,#[Assert\Choice(['acknowledged','in_progress','resolved','rejected'])] public string $status,#[Assert\NotBlank] public string $expectedStatus,#[Assert\Length(max:2000)] public ?string $comment=null){}
}
