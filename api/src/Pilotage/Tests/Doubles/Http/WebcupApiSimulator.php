<?php

declare(strict_types=1);

namespace Tests\Pilotage\Doubles\Http;

use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * Response factory of the test MockHttpClient (`framework.http_client.mock_response_factory`).
 * State is static because the test kernel reboots between requests.
 */
final class WebcupApiSimulator
{
    /** @var list<ResponseInterface> */
    private static array $responses = [];
    /** @var list<array{method: string, url: string, headers: list<string>}> */
    private static array $calls = [];

    public static function reset(): void
    {
        self::$responses = [];
        self::$calls = [];
    }

    public static function respond(ResponseInterface ...$responses): void
    {
        array_push(self::$responses, ...$responses);
    }

    public static function respondJson(array $payload, int $status = 200): void
    {
        self::respond(new MockResponse(json_encode($payload, JSON_THROW_ON_ERROR), ['http_code' => $status, 'response_headers' => ['content-type' => 'application/json']]));
    }

    /** @return list<array{method: string, url: string, headers: list<string>}> */
    public static function calls(): array
    {
        return self::$calls;
    }

    public function __invoke(string $method, string $url, array $options = []): ResponseInterface
    {
        self::$calls[] = ['method' => $method, 'url' => $url, 'headers' => array_values($options['headers'] ?? [])];
        if (self::$responses === []) {
            throw new \LogicException(sprintf('Unexpected HTTP call in tests: %s %s', $method, $url));
        }

        return array_shift(self::$responses);
    }

    /** A realistic answer of the contest API, deliberately out of `sort_order`. */
    public static function samplePayload(): array
    {
        return [
            'session' => [
                'status' => 'running', 'is_running' => true, 'current_wave' => 3, 'elapsed_minutes' => 281,
                'visible_requests_count' => 2, 'next_wave_number' => 4, 'minutes_until_next_wave' => 19,
            ],
            'requests' => [
                [
                    'request_code' => 'F21', 'requester_name' => 'Léa', 'requester_type' => 'Habitante', 'message_public' => 'Lecteur d’écran',
                    'difficulty' => 'Moyenne', 'difficulty_level' => 2, 'xp_base' => 400, 'xp_time_bonus' => 120, 'xp_total' => 520, 'xp_available' => 520,
                    'is_initial' => false, 'wave_number' => 1, 'arrival_time' => '02:00:00', 'group_name' => 'Premiers habitants', 'is_ai_request' => false, 'sort_order' => 11,
                ],
                [
                    'request_code' => 'D01', 'requester_name' => 'Mairie', 'requester_type' => 'Administration', 'message_public' => 'Créer un compte',
                    'difficulty' => 'Facile', 'difficulty_level' => '1', 'xp_base' => '250', 'xp_time_bonus' => 0, 'xp_total' => 250, 'xp_available' => 250,
                    'is_initial' => true, 'wave_number' => 0, 'arrival_time' => '00:00:00', 'group_name' => null, 'is_ai_request' => 0, 'sort_order' => 1,
                ],
            ],
        ];
    }
}
