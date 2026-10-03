<?php

declare(strict_types=1);
namespace Citizen\Application\Command\AuthorizeRequestSubscription;
use Symfony\Component\Validator\Constraints as Assert;
final readonly class AuthorizeRequestSubscriptionCommand {public function __construct(#[Assert\NotBlank] #[Assert\Length(max:200)] public string $topic,#[Assert\Length(max:100)] public ?string $socketId=null){}}
