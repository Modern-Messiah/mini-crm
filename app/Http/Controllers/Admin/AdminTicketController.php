<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTicketStatusRequest;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminTicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService
    ) {
    }

    public function index(Request $request): View
    {
        $filters = $request->only(['status', 'date_from', 'date_to', 'email', 'phone']);
        $tickets = $this->ticketService->getTickets(15, $filters);
        $statuses = TicketStatus::cases();

        return view('admin.tickets.index', compact('tickets', 'filters', 'statuses'));
    }

    public function show(int $id): View
    {
        $ticket = $this->ticketService->getTicketDetails($id);

        if (!$ticket) {
            abort(404);
        }

        $statuses = TicketStatus::cases();

        return view('admin.tickets.show', compact('ticket', 'statuses'));
    }

    public function updateStatus(UpdateTicketStatusRequest $request, int $id): RedirectResponse
    {
        $status = TicketStatus::from($request->validated('status'));
        $ticket = $this->ticketService->updateStatus($id, $status);

        if (!$ticket) {
            abort(404);
        }

        return back()->with('success', 'Статус заявки успешно обновлен.');
    }

    public function downloadFile(int $ticketId, int $mediaId): StreamedResponse
    {
        $ticket = $this->ticketService->getTicketDetails($ticketId);

        if (!$ticket) {
            abort(404);
        }

        $media = $ticket->getMedia('attachments')->find($mediaId);

        if (!$media) {
            abort(404);
        }

        return response()->streamDownload(function () use ($media) {
            echo file_get_contents($media->getPath());
        }, $media->file_name, [
            'Content-Type' => $media->mime_type,
        ]);
    }
}
