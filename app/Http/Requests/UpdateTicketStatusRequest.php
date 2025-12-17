<?php

namespace App\Http\Requests;

use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasAnyRole(['admin', 'manager']);
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::enum(TicketStatus::class),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Статус обязателен для заполнения',
            'status.enum' => 'Выбран недопустимый статус',
        ];
    }
}
