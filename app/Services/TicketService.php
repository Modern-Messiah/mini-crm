<?php

namespace App\Services;

use App\Contracts\TicketRepositoryInterface;
use App\Enums\TicketStatus;
use App\Models\Customer;
use App\Models\Ticket;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class TicketService
{
    public function __construct(
        protected TicketRepositoryInterface $ticketRepository
    ) {
    }

    public function createTicket(array $data, array $files = []): Ticket
    {
        if ($this->ticketRepository->hasRecentTicket($data['phone'], $data['email'])) {
            throw ValidationException::withMessages([
                'phone' => ['Вы уже отправляли заявку сегодня. Пожалуйста, попробуйте завтра.'],
            ]);
        }

        $customer = Customer::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'name' => $data['name'],
                'email' => $data['email'],
            ]
        );

        if ($customer->name !== $data['name'] || $customer->email !== $data['email']) {
            $customer->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);
        }

        $ticket = $this->ticketRepository->create([
            'customer_id' => $customer->id,
            'subject' => $data['subject'],
            'text' => $data['text'],
            'status' => TicketStatus::NEW ,
        ]);

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $ticket->addMedia($file)->toMediaCollection('attachments');
            }
        }

        return $ticket->load('customer');
    }

    public function getTickets(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->ticketRepository->getPaginated($perPage, $filters);
    }

    public function getTicketDetails(int $id): ?Ticket
    {
        return $this->ticketRepository->findWithMedia($id);
    }

    public function updateStatus(int $ticketId, TicketStatus $status): ?Ticket
    {
        $ticket = $this->ticketRepository->find($ticketId);

        if (!$ticket) {
            return null;
        }

        return $this->ticketRepository->updateStatus($ticket, $status);
    }

    public function getStatistics(): array
    {
        return [
            'day' => $this->ticketRepository->countByPeriod('day'),
            'week' => $this->ticketRepository->countByPeriod('week'),
            'month' => $this->ticketRepository->countByPeriod('month'),
            'total' => $this->ticketRepository->countByPeriod('all'),
        ];
    }
}
