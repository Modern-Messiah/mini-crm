<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Resources\StatisticsResource;
use App\Http\Resources\TicketResource;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;

class TicketApiController extends Controller
{
    public function __construct(
        protected TicketService $ticketService
    ) {
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $files = $request->file('files') ?? [];

        if (!is_array($files)) {
            $files = [$files];
        }

        $ticket = $this->ticketService->createTicket($validated, $files);

        return response()->json([
            'success' => true,
            'message' => 'Заявка успешно создана',
            'data' => new TicketResource($ticket),
        ], 201);
    }

    public function statistics(): JsonResponse
    {
        $statistics = $this->ticketService->getStatistics();

        return response()->json([
            'success' => true,
            'data' => new StatisticsResource($statistics),
        ]);
    }
}
