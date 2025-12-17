<?php

use App\Http\Controllers\Api\TicketApiController;
use Illuminate\Support\Facades\Route;

// Public endpoint - create ticket
Route::post('/tickets', [TicketApiController::class, 'store']);

// Protected endpoint - statistics (requires authentication)
Route::middleware('auth:web')->group(function () {
    Route::get('/tickets/statistics', [TicketApiController::class, 'statistics']);
});
