<?php

declare(strict_types=1);

namespace Citizen\Application\Controller;

use Citizen\Application\Command\BookAppointment\BookAppointmentCommand;
use Citizen\Application\Command\ChangeMyAppointment\ChangeMyAppointmentCommand;
use Citizen\Application\Command\OpenAppointmentSlots\OpenAppointmentSlotsCommand;
use Citizen\Application\Command\RemoveAppointmentSlot\RemoveAppointmentSlotCommand;
use Citizen\Application\Query\ListAppointmentDay\ListAppointmentDayQuery;
use Citizen\Application\Query\ListAppointmentSlots\ListAppointmentSlotsQuery;
use Citizen\Application\Query\ListMyAppointments\ListMyAppointmentsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/** Rendez-vous (L10 : F39, F40). */
final class AppointmentController extends AppController
{
    #[Route('/api/citizen/appointments/slots', name: 'citizen_appointment_slots', methods: ['GET'], format: 'json')]
    public function slots(Request $request): JsonResponse
    {
        $serviceId = $request->query->get('serviceId');

        return $this->dispatchQuery(new ListAppointmentSlotsQuery(is_string($serviceId) && $serviceId !== '' ? $serviceId : null));
    }

    #[Route('/api/citizen/appointments', name: 'citizen_my_appointments', methods: ['GET'], format: 'json')]
    public function mine(): JsonResponse
    {
        return $this->dispatchQuery(new ListMyAppointmentsQuery());
    }

    #[Route('/api/citizen/appointments', name: 'citizen_book_appointment', methods: ['POST'], format: 'json')]
    public function book(#[MapRequestPayload] BookAppointmentCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/appointments/change', name: 'citizen_change_appointment', methods: ['POST'], format: 'json')]
    public function change(#[MapRequestPayload] ChangeMyAppointmentCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/appointments', name: 'citizen_agent_appointment_day', methods: ['GET'], format: 'json')]
    public function day(Request $request): JsonResponse
    {
        $date = $request->query->get('date');

        return $this->dispatchQuery(new ListAppointmentDayQuery(is_string($date) && $date !== '' ? $date : null, $request->query->getBoolean('reveal')));
    }

    #[Route('/api/citizen/agent/appointment-slots', name: 'citizen_agent_open_slots', methods: ['POST'], format: 'json')]
    public function open(#[MapRequestPayload] OpenAppointmentSlotsCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/citizen/agent/appointment-slots/remove', name: 'citizen_agent_remove_slot', methods: ['POST'], format: 'json')]
    public function remove(#[MapRequestPayload] RemoveAppointmentSlotCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
