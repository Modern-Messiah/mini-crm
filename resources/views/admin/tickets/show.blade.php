@extends('layouts.admin')

@section('title', "Заявка #{{ $ticket->id }} | Mini-CRM")

@section('content')
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h1>📝 Заявка #{{ $ticket->id }}</h1>
        <a href="{{ route('admin.tickets.index') }}" class="btn btn-secondary">← Назад к списку</a>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <div>
            <div class="card">
                <div class="card-header">Информация о заявке</div>
                <div class="card-body">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 150px;">Дата создания:</td>
                            <td style="padding: 8px 0;">{{ $ticket->created_at->format('d.m.Y H:i') }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Статус:</td>
                            <td style="padding: 8px 0;">
                                @php
                                    $badgeClass = match ($ticket->status->value) {
                                        'new' => 'badge-blue',
                                        'in_progress' => 'badge-yellow',
                                        'processed' => 'badge-green',
                                    };
                                @endphp
                                <span class="badge {{ $badgeClass }}">{{ $ticket->status->label() }}</span>
                            </td>
                        </tr>
                        @if ($ticket->manager_response_at)
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Дата ответа:</td>
                                <td style="padding: 8px 0;">{{ $ticket->manager_response_at->format('d.m.Y H:i') }}</td>
                            </tr>
                        @endif
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Тема:</td>
                            <td style="padding: 8px 0;"><strong>{{ $ticket->subject }}</strong></td>
                        </tr>
                    </table>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <h4 style="margin-bottom: 10px; color: #334155;">Сообщение</h4>
                        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; line-height: 1.6;">
                            {{ $ticket->text }}</div>
                    </div>

                    @if ($ticket->getMedia('attachments')->count() > 0)
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <h4 style="margin-bottom: 10px; color: #334155;">📎 Прикрепленные файлы</h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                @foreach ($ticket->getMedia('attachments') as $media)
                                    <div
                                        style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 12px 16px; border-radius: 8px;">
                                        <div>
                                            <strong>{{ $media->file_name }}</strong>
                                            <span style="color: #64748b; margin-left: 10px;">
                                                ({{ number_format($media->size / 1024, 2) }} KB)
                                            </span>
                                        </div>
                                        <a href="{{ route('admin.tickets.download', [$ticket->id, $media->id]) }}"
                                            class="btn btn-primary btn-sm">
                                            Скачать
                                        </a>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <div>
            <div class="card">
                <div class="card-header">Клиент</div>
                <div class="card-body">
                    <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px;">
                        {{ $ticket->customer->name }}
                    </p>
                    <p style="color: #64748b; margin-bottom: 8px;">
                        📞 <a href="tel:{{ $ticket->customer->phone }}" style="color: inherit;">
                            {{ $ticket->customer->phone }}
                        </a>
                    </p>
                    <p style="color: #64748b;">
                        ✉️ <a href="mailto:{{ $ticket->customer->email }}" style="color: inherit;">
                            {{ $ticket->customer->email }}
                        </a>
                    </p>
                </div>
            </div>

            <div class="card" style="margin-top: 20px;">
                <div class="card-header">Изменить статус</div>
                <div class="card-body">
                    <form action="{{ route('admin.tickets.updateStatus', $ticket) }}" method="POST">
                        @csrf
                        @method('PATCH')

                        <div style="margin-bottom: 16px;">
                            <select name="status"
                                style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                @foreach ($statuses as $status)
                                    <option value="{{ $status->value }}" {{ $ticket->status === $status ? 'selected' : '' }}>
                                        {{ $status->label() }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            Сохранить
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection