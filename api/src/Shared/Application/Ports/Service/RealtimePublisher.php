<?php

declare(strict_types=1);

namespace Shared\Application\Ports\Service;

/**
 * Pushes a short notification to the browsers currently listening to a logical topic.
 *
 * The transport (hosted service, hub, polling…) is an infrastructure detail chosen by composition.
 * Delivery is best effort: an unavailable transport is logged by the adapter, never thrown, so a use case
 * never fails because of real time. Clients reload the authoritative data through the API on reception;
 * the payload only says what changed (identifiers, status), never the full content.
 *
 * Topics are dot-separated segments of lowercase letters, digits, `-` and `_` (e.g. `public.alerts`).
 * Only public topics are supported for now: private topics need a subscription authorization port.
 */
interface RealtimePublisher
{
    public const TOPIC_PATTERN = '/^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/';

    /**
     * @param string               $topic   logical destination, see TOPIC_PATTERN
     * @param string               $event   event name for clients, e.g. `alert.published`
     * @param array<string, mixed> $payload small JSON-encodable data
     *
     * @throws \InvalidArgumentException when the topic or event name is malformed (programming error)
     */
    public function publish(string $topic, string $event, array $payload = []): void;
}
