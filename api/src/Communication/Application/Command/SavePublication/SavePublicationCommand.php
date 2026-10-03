<?php
namespace Communication\Application\Command\SavePublication;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class SavePublicationCommand {
 public function __construct(#[Assert\NotBlank] public string $id,public string $title,public string $category,public string $summary,public array $body,public string $state='draft',public bool $important=false,public ?string $severity=null,public string $audience='all',public ?string $district=null,public ?string $startsAt=null,public ?string $endsAt=null,public string $recommendations='') {}
}
