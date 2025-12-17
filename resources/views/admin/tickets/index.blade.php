@extends('layouts.admin')

@section('title', 'Заявки | Mini-CRM')

@section('content')
    <div class="page-header">
        <h1>📋 Список заявок</h1>
    </div>

    <div class="card">
        <div class="card-header">
            Фильтры
        </div>
        <div class="card-body">
            <form action="{{ route('admin.tickets.index') }}" method="GET" class="filter-form">
                <select name="status">
                    <option value="">Все статусы</option>
                    @foreach ($statuses as $status)
                        <option value="{{ $status->value }}" {{ ($filters['status'] ?? '') === $status->value ? 'selected' : '' }}>
                            {{ $status->label() }}
                        </option>
                    @endforeach
                </select>

                <input type="date" name="date_from" value="{{ $filters['date_from'] ?? '' }}" placeholder="Дата от">
                <input type="date" name="date_to" value="{{ $filters['date_to'] ?? '' }}" placeholder="Дата до">
                <input type="email" name="email" value="{{ $filters['email'] ?? '' }}" placeholder="Email клиента">
                <input type="tel" name="phone" value="{{ $filters['phone'] ?? '' }}" placeholder="Телефон">

                <button type="submit" class="btn btn-primary">Применить</button>
                <a href="{{ route('admin.tickets.index') }}" class="btn btn-secondary">Сбросить</a>
            </form>
        </div>
    </div>

    <div class="card" style="margin-top: 20px;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Дата</th>
                        <th>Клиент</th>
                        <th>Тема</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($tickets as $ticket)
                        <tr>
                            <td>#{{ $ticket->id }}</td>
                            <td>{{ $ticket->created_at->format('d.m.Y H:i') }}</td>
                            <td>
                                <strong>{{ $ticket->customer->name }}</strong><br>
                                <small style="color: #64748b;">
                                    {{ $ticket->customer->phone }}<br>
                                    {{ $ticket->customer->email }}
                                </small>
                            </td>
                            <td>{{ Str::limit($ticket->subject, 40) }}</td>
                            <td>
                                @php
                                    $badgeClass = match($ticket->status->value) {
                                        'new' => 'badge-blue',
                                        'in_progress' => 'badge-yellow',
                                        'processed' => 'badge-green',
                                    };
                                @endphp
                                <span class="badge {{ $badgeClass }}">{{ $ticket->status->label() }}</span>
                            </td>
                            <td>
                                <a href="{{ route('admin.tickets.show', $ticket) }}" class="btn btn-primary btn-sm">
                                    Подробнее
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                                Заявки не найдены
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        @if ($tickets->hasPages())
            <div class="pagination-wrapper">
                <div class="pagination-info">
                    Показано {{ $tickets->firstItem() }}-{{ $tickets->lastItem() }} из {{ $tickets->total() }} заявок
                </div>
                <div class="pagination-nav">
                    @if ($tickets->onFirstPage())
                        <span class="pagination-btn pagination-btn-disabled">
                            ← Назад
                        </span>
                    @else
                        <a href="{{ $tickets->previousPageUrl() }}" class="pagination-btn">
                            ← Назад
                        </a>
                    @endif

                    <span class="pagination-current">
                        Страница {{ $tickets->currentPage() }} из {{ $tickets->lastPage() }}
                    </span>

                    @if ($tickets->hasMorePages())
                        <a href="{{ $tickets->nextPageUrl() }}" class="pagination-btn">
                            Вперед →
                        </a>
                    @else
                        <span class="pagination-btn pagination-btn-disabled">
                            Вперед →
                        </span>
                    @endif
                </div>
            </div>

            <style>
                .pagination-wrapper {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-top: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                .pagination-info {
                    color: #64748b;
                    font-size: 0.875rem;
                }
                .pagination-nav {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .pagination-btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: #fff;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .pagination-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .pagination-btn-disabled {
                    background: #e2e8f0;
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .pagination-btn-disabled:hover {
                    background: #e2e8f0;
                    transform: none;
                }
                .pagination-current {
                    color: #475569;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
            </style>
        @endif
    </div>
@endsection
