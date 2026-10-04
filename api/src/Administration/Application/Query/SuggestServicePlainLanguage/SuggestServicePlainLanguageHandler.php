<?php

declare(strict_types=1);

namespace Administration\Application\Query\SuggestServicePlainLanguage;

use Administration\Application\Command\SaveMunicipalService\SaveMunicipalServiceHandler;
use Administration\Application\Ports\Provider\PlainLanguageDrafter;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsHandler;
use Administration\Application\Query\CheckCurrentMemberPermissions\CheckCurrentMemberPermissionsQuery;
use Shared\Domain\Exception\AccessDeniedException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/** Propose sans enregistrer : la version « En clair » n'est publiée que lorsque l'agent enregistre la fiche. */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class SuggestServicePlainLanguageHandler
{
    public function __construct(
        private PlainLanguageDrafter $drafter,
        private CheckCurrentMemberPermissionsHandler $permissions,
    ) {}

    /** @return array{text: string, source: string} */
    public function __invoke(SuggestServicePlainLanguageQuery $query): array
    {
        if (!($this->permissions)(new CheckCurrentMemberPermissionsQuery([SaveMunicipalServiceHandler::PERMISSION]))) {
            throw new AccessDeniedException('Permission de gestion des services requise.');
        }
        $draft = $this->drafter->draft($query->name, [$query->summary, $query->description]);

        return ['text' => $draft->text, 'source' => $draft->fromModel ? 'model' : 'local'];
    }
}
