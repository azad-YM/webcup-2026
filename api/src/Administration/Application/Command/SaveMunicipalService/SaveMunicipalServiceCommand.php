<?php
namespace Administration\Application\Command\SaveMunicipalService;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class SaveMunicipalServiceCommand {
 public function __construct(#[Assert\NotBlank] public string $id, public string $name, public string $category, public string $summary, public string $description, public array $actions, public array $contact, public bool $featured=false, public array $keywords=[], public string $status='operational', public string $statusMessage='', public ?array $transport=null) {}
}
