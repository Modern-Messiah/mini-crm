<?php

namespace App\Contracts;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface TicketRepositoryInterface
{
    public function create(array $data): Ticket;

    public function find(int $id): ?Ticket;

    public function findWithMedia(int $id): ?Ticket;

    public function getAll(): Collection;

    public function getPaginated(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function updateStatus(Ticket $ticket, TicketStatus $status): Ticket;

    public function countByPeriod(string $period): int;

    public function hasRecentTicket(string $phone, string $email): bool;
}
