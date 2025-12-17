<?php

namespace App\Repositories;

use App\Contracts\TicketRepositoryInterface;
use App\Enums\TicketStatus;
use App\Models\Customer;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class TicketRepository implements TicketRepositoryInterface
{
    public function create(array $data): Ticket
    {
        return Ticket::create($data);
    }

    public function find(int $id): ?Ticket
    {
        return Ticket::with('customer')->find($id);
    }

    public function findWithMedia(int $id): ?Ticket
    {
        return Ticket::with(['customer', 'media'])->find($id);
    }

    public function getAll(): Collection
    {
        return Ticket::with('customer')->orderBy('created_at', 'desc')->get();
    }

    public function getPaginated(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Ticket::with('customer')->orderBy('created_at', 'desc');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['email'])) {
            $query->whereHas('customer', function ($q) use ($filters) {
                $q->where('email', 'like', '%' . $filters['email'] . '%');
            });
        }

        if (!empty($filters['phone'])) {
            $query->whereHas('customer', function ($q) use ($filters) {
                $q->where('phone', 'like', '%' . $filters['phone'] . '%');
            });
        }

        return $query->paginate($perPage);
    }

    public function updateStatus(Ticket $ticket, TicketStatus $status): Ticket
    {
        $ticket->status = $status;

        if ($status === TicketStatus::PROCESSED && !$ticket->manager_response_at) {
            $ticket->manager_response_at = Carbon::now();
        }

        $ticket->save();

        return $ticket;
    }

    public function countByPeriod(string $period): int
    {
        $query = Ticket::query();

        return match ($period) {
            'day' => $query->whereDate('created_at', Carbon::today())->count(),
            'week' => $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->count(),
            'month' => $query->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)->count(),
            default => $query->count(),
        };
    }

    public function hasRecentTicket(string $phone, string $email): bool
    {
        return Ticket::whereHas('customer', function ($query) use ($phone, $email) {
            $query->where('phone', $phone)->orWhere('email', $email);
        })
            ->whereDate('created_at', Carbon::today())
            ->exists();
    }
}
