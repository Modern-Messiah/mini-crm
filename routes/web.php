<?php

use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\WidgetController;
use Illuminate\Support\Facades\Route;

// Widget route (public)
Route::get('/widget', [WidgetController::class, 'index'])->name('widget');
Route::get('/feedback-widget', [WidgetController::class, 'index'])->name('feedback-widget');

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Admin routes (protected)
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/{id}', [AdminTicketController::class, 'show'])->name('tickets.show');
    Route::patch('/tickets/{id}/status', [AdminTicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::get('/tickets/{ticketId}/files/{mediaId}', [AdminTicketController::class, 'downloadFile'])->name('tickets.download');
});

// Redirect home to widget
Route::get('/', function () {
    return redirect()->route('widget');
});
