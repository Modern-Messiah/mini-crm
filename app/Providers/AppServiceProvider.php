<?php

namespace App\Providers;

use App\Contracts\TicketRepositoryInterface;
use App\Repositories\TicketRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TicketRepositoryInterface::class, TicketRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
