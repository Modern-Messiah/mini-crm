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

    /**
     * Create a new ticket with customer and attachments.
     *
     * @throws ValidationException
     */
    public function createTicket(array $data, array $files = []): Ticket
    {
        // Check rate limit (1 ticket per day from same phone/email)
        if ($this->ticketRepository->hasRecentTicket($data['phone'], $data['email'])) {
            throw ValidationException::withMessages([
                'phone' => ['Вы уже отправляли заявку сегодня. Пожалуйста, попробуйте завтра.'],
            ]);
        }

        // Find or create customer
        $customer = Customer::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'name' => $data['name'],
                'email' => $data['email'],
            ]
        );

        // Update customer name and email if changed
        if ($customer->name !== $data['name'] || $customer->email !== $data['email']) {
            $customer->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);
        }

        // Create ticket
        $ticket = $this->ticketRepository->create([
            'customer_id' => $customer->id,
            'subject' => $data['subject'],
            'text' => $data['text'],
            'status' => TicketStatus::NEW ,
        ]);

        // Attach files
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $ticket->addMedia($file)->toMediaCollection('attachments');
            }
        }

        return $ticket->load('customer');
    }

    /**
     * Get paginated tickets with filters.
     */
    public function getTickets(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->ticketRepository->getPaginated($perPage, $filters);
    }

    /**
     * Get ticket with full details.
     */
    public function getTicketDetails(int $id): ?Ticket
    {
        return $this->ticketRepository->findWithMedia($id);
    }

    /**
     * Update ticket status.
     */
    public function updateStatus(int $ticketId, TicketStatus $status): ?Ticket
    {
        $ticket = $this->ticketRepository->find($ticketId);

        if (!$ticket) {
            return null;
        }

        return $this->ticketRepository->updateStatus($ticket, $status);
    }

    /**
     * Get statistics for the given periods.
     */
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
