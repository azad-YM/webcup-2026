<?php

declare(strict_types=1);

namespace Tests\IAM\Suites\Unit;

use IAM\Application\DTO\AccessibleSpace;
use IAM\Application\Query\ListMySpaces\ListMySpacesHandler;
use IAM\Application\Query\ListMySpaces\ListMySpacesQuery;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Tests\IAM\Doubles\Provider\StubAccessibleSpacesProvider;
use Tests\IAM\Doubles\Provider\StubAuthenticatedUserProvider;

#[Group('Unit')]
final class ListMySpacesTest extends TestCase
{
    public function testAggregatesProvidersForAuthenticatedUserAndDeduplicatesDestinations(): void
    {
        $providers = (static function (): \Generator {
            yield new StubAccessibleSpacesProvider(['me' => [new AccessibleSpace('admin', 'Administration', 'Description de l’administration.', ['Gestionnaire'])]]);
            yield new StubAccessibleSpacesProvider(['me' => [new AccessibleSpace('demo', 'Démo', 'Description de la démo.', ['Gestionnaire']), new AccessibleSpace('demo', 'Démo', 'Description de la démo.', ['Gestionnaire'])]]);
            yield new StubAccessibleSpacesProvider(['other' => [new AccessibleSpace('other', 'Autre', 'Description d’un autre espace.', ['Gestionnaire'])]]);
        })();
        $handler = new ListMySpacesHandler(new StubAuthenticatedUserProvider('me'), $providers);
        self::assertEquals([new AccessibleSpace('admin', 'Administration', 'Description de l’administration.', ['Gestionnaire']), new AccessibleSpace('demo', 'Démo', 'Description de la démo.', ['Gestionnaire'])], $handler(new ListMySpacesQuery()));
    }

    public function testReturnsEmptyListWithoutAccess(): void
    {
        $handler = new ListMySpacesHandler(new StubAuthenticatedUserProvider('me'), [new StubAccessibleSpacesProvider()]);
        self::assertSame([], $handler(new ListMySpacesQuery()));
    }

    public function testDoesNotHideProviderFailureAsMissingAccess(): void
    {
        $handler = new ListMySpacesHandler(new StubAuthenticatedUserProvider('me'), [new StubAccessibleSpacesProvider(unavailable: true)]);
        $this->expectException(\RuntimeException::class);
        $handler(new ListMySpacesQuery());
    }
}
