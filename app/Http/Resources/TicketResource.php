<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'text' => $this->text,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'manager_response_at' => $this->manager_response_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'customer' => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
                'email' => $this->customer->email,
            ],
            'files' => $this->whenLoaded('media', function () {
                return $this->getMedia('attachments')->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'name' => $media->file_name,
                        'size' => $media->size,
                        'mime_type' => $media->mime_type,
                        'url' => $media->getUrl(),
                    ];
                });
            }),
        ];
    }
}
