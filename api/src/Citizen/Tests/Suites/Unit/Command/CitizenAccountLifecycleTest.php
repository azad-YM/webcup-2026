<?php

declare(strict_types=1);

namespace Tests\Citizen\Suites\Unit\Command;

use Citizen\Application\Command\DeleteMyCitizenAccount\DeleteMyCitizenAccountCommand;
use Citizen\Application\Command\DeleteMyCitizenAccount\DeleteMyCitizenAccountHandler;
use Citizen\Application\Command\SetCitizenSuspension\SetCitizenSuspensionCommand;
use Citizen\Application\Command\SetCitizenSuspension\SetCitizenSuspensionHandler;
use Citizen\Application\Query\ListCitizenAccounts\ListCitizenAccountsHandler;
use Citizen\Application\Query\ListCitizenAccounts\ListCitizenAccountsQuery;
use Citizen\Domain\Entity\Citizen;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shared\Domain\Exception\AccessDeniedException;
use Shared\Domain\Exception\ConflitException;
use Tests\Citizen\Doubles\Provider\StubCitizenAccountManager;
use Tests\Citizen\Doubles\Provider\StubCitizenAccountAccessPolicy;
use Tests\Citizen\Doubles\Provider\StubCurrentAccountProvider;
use Tests\Citizen\Doubles\Repository\RamCitizenRepository;

#[Group('Unit')]
final class CitizenAccountLifecycleTest extends TestCase
{
    private RamCitizenRepository $citizens;
    private StubCitizenAccountManager $accounts;
    private StubCitizenAccountAccessPolicy $access;
    private DeleteMyCitizenAccountHandler $delete;
    private SetCitizenSuspensionHandler $suspend;
    protected function setUp(): void { parent::setUp(); $this->bootHandler(); }
    private function bootHandler(): void
    {
        $this->citizens = new RamCitizenRepository();
        $citizen = new Citizen('citizen', 'user', new \DateTimeImmutable());
        $citizen->updateProfile('Ada', 'Lovelace', '123', 'Main street', 'Nord', 'fr');
        $this->citizens->save($citizen);
        $this->accounts = new StubCitizenAccountManager();
        $this->access = new StubCitizenAccountAccessPolicy();
        $this->delete = new DeleteMyCitizenAccountHandler($this->citizens, new StubCurrentAccountProvider('user'), $this->accounts, $this->access);
        $this->suspend = new SetCitizenSuspensionHandler($this->citizens, $this->accounts, $this->access);
    }
    public function testDeletesOnlyCurrentAccountAndErasesProfile(): void
    {
        ($this->delete)(new DeleteMyCitizenAccountCommand('password'));
        $citizen = $this->citizens->findById('citizen');
        self::assertSame('deleted', $citizen->status());
        self::assertNull($citizen->firstName()); self::assertNull($citizen->phone()); self::assertNull($citizen->address());
        self::assertSame(['user' => 'deleted'], $this->accounts->statuses);
        self::assertSame([], $this->citizens->findAccounts());
    }
    public function testWrongPasswordDoesNotChangeAnything(): void
    {
        $this->accounts->validPassword = false;
        $this->expectException(AccessDeniedException::class);
        try { ($this->delete)(new DeleteMyCitizenAccountCommand('wrong')); }
        finally { self::assertSame([], $this->accounts->statuses); self::assertSame(1, $this->citizens->saves); }
    }
    public function testActiveMemberCannotDeleteSharedAccount(): void
    {
        $this->access->protected = ['user'];
        $this->expectException(ConflitException::class);
        try { ($this->delete)(new DeleteMyCitizenAccountCommand('password')); }
        finally { self::assertSame([], $this->accounts->statuses); }
    }
    public function testSuspensionAndReactivation(): void
    {
        ($this->suspend)(new SetCitizenSuspensionCommand('citizen', true));
        self::assertSame('suspended', $this->citizens->findById('citizen')->status());
        ($this->suspend)(new SetCitizenSuspensionCommand('citizen', false));
        self::assertSame('active', $this->citizens->findById('citizen')->status());
    }
    public function testUnauthorizedAgentCannotSuspend(): void
    {
        $this->access->manage = false;
        $this->expectException(AccessDeniedException::class);
        try { ($this->suspend)(new SetCitizenSuspensionCommand('citizen', true)); }
        finally { self::assertSame([], $this->accounts->statuses); self::assertSame(1, $this->citizens->saves); }
    }
    public function testSharedAgentAccountCannotBeSuspended(): void
    {
        $this->access->protected = ['user'];
        $this->expectException(ConflitException::class);
        ($this->suspend)(new SetCitizenSuspensionCommand('citizen', true));
    }
    public function testDeletedAccountCannotBeRestored(): void
    {
        ($this->delete)(new DeleteMyCitizenAccountCommand('password'));
        $this->expectException(ConflitException::class);
        ($this->suspend)(new SetCitizenSuspensionCommand('citizen', false));
    }
    public function testReadOnlyAgentReceivesNoMutationCapability(): void
    {
        $this->access->manage = false;
        $result = (new ListCitizenAccountsHandler($this->citizens, $this->accounts, $this->access))(new ListCitizenAccountsQuery());
        self::assertFalse($result['canManage']);
        self::assertFalse($result['items'][0]['canSuspend']);
    }
}
