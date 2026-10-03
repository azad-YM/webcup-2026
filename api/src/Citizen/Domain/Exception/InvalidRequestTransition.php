<?php

declare(strict_types=1);

namespace Citizen\Domain\Exception;

use Shared\Domain\Exception\ConflitException;

/** Transition refusée par le cycle de vie (statut final ou saut interdit) : `409`. */
final class InvalidRequestTransition extends ConflitException {}
