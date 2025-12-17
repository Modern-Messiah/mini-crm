<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'regex:/^\+[1-9]\d{1,14}$/',
            ],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'files' => ['nullable', 'array', 'max:5'],
            'files.*' => ['file', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Номер телефона должен быть в формате E.164 (например, +79991234567)',
            'files.max' => 'Можно прикрепить не более 5 файлов',
            'files.*.max' => 'Размер файла не должен превышать 10 МБ',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'имя',
            'phone' => 'телефон',
            'email' => 'email',
            'subject' => 'тема',
            'text' => 'сообщение',
            'files' => 'файлы',
        ];
    }
}
