<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\ExportMyPersonalData\ExportMyPersonalDataCommand;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** F55 : « Mes données ». POST : la confirmation d'identité voyage dans le corps, jamais dans l'URL. */
final class PersonalDataController extends AppController
{
    #[Route('/api/citizen/me/personal-data', name: 'citizen_my_personal_data', methods: ['POST'], format: 'json')]
    public function export(#[MapRequestPayload] ExportMyPersonalDataCommand $cmd): JsonResponse
    {
        $response = $this->dispatch($cmd);
        // Refus de confirmation retourné par le handler (la transaction est validée : l'essai manqué reste compté).
        $data = json_decode((string) $response->getContent(), true);
        if (is_array($data) && isset($data['httpStatus'])) {
            $status = (int) $data['httpStatus'];
            unset($data['httpStatus']);

            return new JsonResponse($data, $status);
        }
        $response->headers->set('Cache-Control', 'no-store');

        return $response;
    }
}
