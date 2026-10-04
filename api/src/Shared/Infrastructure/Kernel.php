<?php

declare(strict_types=1);

namespace Shared\Infrastructure;

use Shared\Infrastructure\Doctrine\EncryptedStringType;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    /** F69 (ADR 007) : la clé de chiffrement au repos est fournie au type Doctrine dès le démarrage (HTTP, CLI, migrations). */
    public function boot(): void
    {
        parent::boot();
        $container = $this->getContainer();
        EncryptedStringType::useKey(EncryptedStringType::deriveKey(
            (string) $container->getParameter('app.data_encryption_key'),
            (string) $container->getParameter('kernel.secret'),
        ));
    }
}
